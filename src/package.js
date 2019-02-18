/**
 * @file Display a summary of the generated UWP app package, and make it downloadable.
 * @see package.html The document this file scripts and depends on.
 * @see https://docs.microsoft.com/windows/uwp/packaging/
 * @author Paul <paul@fragara.com>
 * @since 2018
 * @license CC0-1.0
 *  The author has dedicated all rights to this software to the public domain.
 *  This software is distributed without any warranty.
 */

import { savedIcons, savedManifest } from "./app.js";
import { ZipEntry } from "./zip.js";


/** @return {!ArrayBuffer} The input string, encoded as UTF-8.
 * @param {string} str  The input.
 * @see https://developer.mozilla.org/docs/Web/API/TextEncoder
 * @see https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js
 */
const toUTF8Buffer = (self.TextEncoder !== undefined)
  ? TextEncoder.prototype.encode.bind(new TextEncoder)
  : function(str) {
    const /** Array<number> */ out = [];

    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);

      if (c < 128) {
        out.push(c);
      } else if (c < 2048) {
        out.push(
          (c >> 6) | 192,
          (c & 63) | 128
        );
      } else if ((c & 0xfc00) === 0xd800 &&
                 (i + 1) < str.length &&
                 (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) { // surrogate
        c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
        out.push(
          (c >> 18) | 240,
          ((c >> 12) & 63) | 128,
          ((c >> 6) & 63) | 128,
          (c & 63) | 128
        );
      } else {
        out.push(
          (c >> 12) | 224,
          ((c >> 6) & 63) | 128,
          (c & 63) | 128
        );
      }
    }
    return new Uint8Array(out).buffer;
  };


Promise.all([savedIcons, savedManifest]).then(function setup(results) {
  const /** !Object<string,!Uint8Array> */ icons = results[0];
  const /** string|undefined */ manif = results[1];

  const downloadLink = document.querySelector("a[download]");

  // CloudAppX wants content to be put in a folder named by the .zip basename:
  const zipFilename = downloadLink.getAttribute("download");
  const folderName = zipFilename.substr(0, zipFilename.indexOf(".")) + "/";

  const /** Array<!ZipEntry> */ zipEntries = [];

  icons: {
    const DPR = (self.devicePixelRatio < 2) ? 1 : ((self.devicePixelRatio === 2) ? 2 : 4);

    for (const name in icons) {
      const scale = Number(name.substr(name.indexOf("-") + 1, 1));
      console.assert([1, 2, 4].indexOf(scale) !== -1, "Valid icon scale", scale);

      zipEntries.push(new ZipEntry(folderName + name, icons[name]));
      if (scale === DPR) {
        const thumbElt = document.getElementById(name.substr(0, name.indexOf(".")));

        thumbElt.src = URL.createObjectURL(new Blob([icons[name]], { "type": "image/png" }));
        thumbElt.onload = function() { URL.revokeObjectURL(this.src); };
      }
    }
  }

  manifest: {
    if (manif === undefined) return;
    document.querySelector("textarea").value = manif;

    color_tile_backplates: {
      const bgColor = (new DOMParser)
        .parseFromString(manif, "text/xml")
        .querySelector("VisualElements")
        .getAttribute("BackgroundColor");

      document.styleSheets[document.styleSheets.length - 1]
        .insertRule(`img{background:${bgColor}}`, 0);
    }

    if (zipEntries.length < 6) return; // some icons are missing
    zipEntries.push(new ZipEntry(folderName + "appxmanifest.xml", toUTF8Buffer(manif)));
  }

  zip_download: {
    const zip = ZipEntry.toBlob(zipEntries);
    const downloadBtn = downloadLink.nextElementSibling;

    if (document.documentMode !== undefined) { // navigating to a Blob doesn’t work on IE
      downloadBtn.onclick = navigator.msSaveOrOpenBlob.bind(navigator, zip, zipFilename);
    } else {
      downloadLink.href = URL.createObjectURL(zip);
      downloadBtn.onclick = downloadLink.click.bind(downloadLink);
    }
    downloadBtn.disabled = false;
  }
});
