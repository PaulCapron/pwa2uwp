/**
 * @file Creation of ZIP archives with no compression and only safe ASCII filenames.
 * @module
 *
 * The code is given bottom-up. It matches the specification closely, apart from:
 *  — Not including filename bytes in its own “local file header” and “central
 *    directory file header” datastructures, to avoid needless copies.
 *  — Bundling the last modification date and time in a single uint32. In MS-DOS
 *    and in the Zip specification, they are two separate uint16. The high-level
 *    ZipEntry datastructure takes a JavaScript Date object as input anyway.
 *
 * @see https://en.wikipedia.org/wiki/Zip_(file_format)#Design
 * @see https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 * @see https://users.cs.jmu.edu/buchhofp/forensics/formats/pkzip.html
 * @see https://stuk.github.io/jszip/
 * @author Paul <paul@fragara.com>
 * @since 2018
 * @license CC0-1.0
 *  The author has dedicated all rights to this software to the public domain.
 *  This software is distributed without any warranty.
 */


/** Precomputed CRC-32 lookup table for half-bytes (aka “nibbles”).
 * Trade more compute time for less memory and less code to transmit.
 * @see https://create.stephan-brumme.com/crc32/#half-byte
 */
const CRC32_NIBBLE_TABLE = new Uint32Array([
           0, 0x1DB71064, 0x3B6E20C8, 0x26D930AC, 0x76DC4190, 0x6B6B51F4, 0x4DB26158, 0x5005713C,
  0xEDB88320, 0xF00F9344, 0xD6D6A3E8, 0xCB61B38C, 0x9B64C2B0, 0x86D3D2D4, 0xA00AE278, 0xBDBDF21C
]);

/** @return {number} CRC-32 (polynomial 0x04C11DB7) of the input data.
 * @param {!BufferSource} data  The input data.
 * @param {number=} previousValue  The previous CRC value, if resuming a computation.
 * @see https://en.wikipedia.org/wiki/Cyclic_redundancy_check#CRC-32_algorithm
 */
export function crc32(data, previousValue = 0) {
  const bytes = ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);
  let crc = ~previousValue;

  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 4) ^ CRC32_NIBBLE_TABLE[0x0f & (crc ^ bytes[i])];
    crc = (crc >>> 4) ^ CRC32_NIBBLE_TABLE[0x0f & (crc ^ (bytes[i] >> 4))];
  }
  return ~crc;
}


/** @return {number} MS-DOS date + time stamps, bundled into a single uint32.
 * @param {!Date} date  The Date object to convert.
 * @see https://docs.microsoft.com/windows/desktop/SysInfo/ms-dos-date-and-time
 * @see https://docs.microsoft.com/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
 */
export function toDOSDatetime(date) {
  console.assert(
    date.getFullYear() >= 1980 && date.getFullYear() < 2108, "Date in range for MS-DOS format"
  );
  return (date.getFullYear() - 1980) << 25
       | (date.getMonth() + 1)       << 21
       |  date.getDate()             << 16
       |  date.getHours()            << 11
       |  date.getMinutes()          <<  5
       | (date.getSeconds() >> 1);
}


/** @return {!DataView} The fixed part of a zip “local file header”.
 *  The filename is _not_ included.
 * @param {number} nameLength  The filename length, in bytes.
 * @param {number} modifDatetime  The datetime of last modification, in MS-DOS format.
 * @param {number} dataCRC  CRC-32 of the file data.
 * @param {number} dataLength  The length of the file data, in bytes.
 *
 * @see Zip file format specification, § 4.3.7
 */
export function LocalFileHeader(nameLength, modifDatetime, dataCRC, dataLength) {
  const data = new DataView(new ArrayBuffer(30));

  /*
   * In the following, some lines are commented out because ArrayBuffers
   * are initialized to all zeroes. “true” means little-endian.
   */

  data.setUint32( 0,    0x04034B50, true); // local file header signature
  data.setUint16( 4,            20, true); // version needed to extract (≥2.0)
//data.setUint16( 6,             0      ); // general purpose bit flag (no flag)
//data.setUint16( 8,             0      ); // compression method (none)
  data.setUint32(10, modifDatetime, true); // last mod file date and time
  data.setUint32(14,       dataCRC, true); // crc-32
  data.setUint32(18,    dataLength, true); // compressed size
  data.setUint32(22,    dataLength, true); // uncompressed size
  data.setUint16(26,    nameLength, true); // file name length
//data.setUint16(28,             0      ); // extra field length (no extra)

  return data;
}


/** @return {!DataView} The fixed part of a zip “central directory file header”.
 *  The filename is _not_ included.
 * @param {number} nameLength  The filename length, in bytes.
 * @param {number} modifDatetime  The datetime of last modification, in MS-DOS format.
 * @param {number} dataCRC  CRC-32 of the file data.
 * @param {number} dataLength  The length of the file data, in bytes.
 * @param {boolean} isText  True if the file data is (supposed to be) textual.
 *  This is only a hint that a decompressor can use to adjust line terminators.
 * @param {number=} opt_localHeaderOffset  The position, in bytes, of the corresponding
 *  “local file header” in the archive. You may not know that upfront, so it’s an
 *  optional parameter. You can write it later, as a uint32 at offset 42 of the buffer.
 *
 * @see Zip file format specification, § 4.3.12
 */
export function CentralDirectoryFileHeader(
  nameLength, modifDatetime, dataCRC, dataLength, isText, opt_localHeaderOffset
) {
  const data = new DataView(new ArrayBuffer(46));

  data.setUint32( 0,     0x02014B50, true); // central file header signature
  data.setUint8(  4,             63      ); // version made by, lower byte (6.3)
//data.setUint8(  5,              0      ); // version made by, upper byte (DOS)
  data.setUint16( 6,             20, true); // version needed to extract (≥2.0)
//data.setUint16( 8,              0      ); // general purpose bit flag (no flag)
//data.setUint16(10,              0      ); // compression method (none)
  data.setUint32(12,  modifDatetime, true); // last mod file date and time
  data.setUint32(16,        dataCRC, true); // crc-32
  data.setUint32(20,     dataLength, true); // compressed size
  data.setUint32(24,     dataLength, true); // uncompressed size
  data.setUint16(28,     nameLength, true); // file name length
//data.setUint16(30,              0      ); // extra field length (no extra)
//data.setUint16(32,              0      ); // file comment length (no comment)
//data.setUint16(34,              0      ); // disk number start (first one)
  data.setUint16(36, Number(isText), true); // internal file attributes
//data.setUint32(38,              0      ); // external file attributes (unused)
  if (opt_localHeaderOffset) {
    data.setUint32(42, opt_localHeaderOffset, true); // offset of local header
  }

  return data;
}


/** @return {!DataView} A zip “central directory end record”.
 * @param {number} entryCount  The number of files in the archive.
 * @param {number} size  The size, in bytes, of the “central directory” section.
 *  This is the sum of all the “central directory file headers” (filenames _included_).
 *  But this should _not_ include the size of the end record itself.
 * @param {number} offset  The position, in bytes, where the central directory starts
 *  in the archive. That’s after all the “local file headers” and file data.
 *
 * @see Zip file format specification, § 4.3.16
 */
function CentralDirectoryEndRecord(entryCount, size, offset) {
  const data = new DataView(new ArrayBuffer(22));

  data.setUint32( 0, 0x06054B50, true); // end of central dir signature
//data.setUint16( 4,          0      ); // number of this disk
//data.setUint16( 6,          0      ); // number of the disk with the start of the central dir
  data.setUint16( 8, entryCount, true); // number of entries of the central dir on this disk
  data.setUint16(10, entryCount, true); // total number of entries in the central dir
  data.setUint32(12,       size, true); // size of the central directory
  data.setUint32(16,     offset, true); // offset of start of central directory
//data.setUint16(20,          0      ); // zip file comment length

  return data;
}


/** A ZipEntry represents a file in a zip archive. */
export class ZipEntry {

  /** Make a new zip archive entry.
   * @param {string} name  (File)name of the entry.
   * @param {!BufferSource} data  Content of the entry.
   * @param {!Date=} lastModif  Date of last modification for this entry.
   * @param {boolean=} isText  True if the data is supposedly textual.
   * @param {number=} dataCRC  CRC-32 value of the data.
   */
  constructor(name, data, lastModif = new Date, isText = false, dataCRC = crc32(data)) {
    console.assert(/^[a-z0-9][a-z0-9/\-\.]{0,254}$/i.test(name), "Safe name", name);

    const mtime = toDOSDatetime(lastModif);

    /** Filename.
     * @const {string}
     */
    this.name = name;

    /** Content.
     * @const {!BufferSource}
     */
    this.data = data;

    /** Fixed part of the “local file header”.
     * @const {!DataView}
     */
    this.localHead = LocalFileHeader(name.length, mtime, dataCRC, data.byteLength);

    /** Fixed part of the “central directory file header”.
     * @const {!DataView}
     */
    this.centralHead = CentralDirectoryFileHeader(
      name.length, mtime, dataCRC, data.byteLength, isText
    );
  }

  /** @param {number} offset  The offset, in bytes, of the “local file header” in the archive. */
  setLocalHeaderOffset(offset) {
    this.centralHead.setUint32(42, offset, true);
  }

  /** @return {!Blob} A zip archive as a Blob object.
   * @param {!Array<!ZipEntry>} entries  The entries composing the archive.
   */
  static toBlob(entries) {
    const parts = new Array(entries.length * 5 + 1);
    let offs = 0;
    let size = 0;

    for (
      let i = 0, li = 0, ci = entries.length * 3;
      i < entries.length;
      i++, li += 3, ci += 2
    ) {
      const ent = entries[i];

      parts[li]     = ent.localHead;
      parts[li + 1] = ent.name;
      parts[li + 2] = ent.data;
      parts[ci]     = ent.centralHead;
      parts[ci + 1] = ent.name;

      ent.setLocalHeaderOffset(offs);
      offs += ent.localHead.byteLength + ent.name.length + ent.data.byteLength;
      size += ent.centralHead.byteLength + ent.name.length;
    }
    parts[parts.length - 1] = CentralDirectoryEndRecord(entries.length, size, offs);

    // Blob construction fails on IE if one of the parts is a DataView:
    if (document.documentMode !== undefined) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (part instanceof DataView) {
          parts[i] = new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
        }
      }
    }

    return new Blob(parts, { "type": "application/zip" });
  }

}
