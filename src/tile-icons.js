/**
 * @file Generate tile icons for a Windows 10 application.
 * @see https://docs.microsoft.com/windows/uwp/design/shell/tiles-and-notifications/app-assets
 * @author Paul <paul@fragara.com>
 * @since 2018
 * @license CC0-1.0
 *  To the extent possible under law, the author has dedicated all copyright
 *  and related and neighboring rights to this software to the public domain
 *  worldwide. This software is distributed without any warranty.
 *  For more information, see https://creativecommons.org/publicdomain/zero/1.0/
 */

import { database, saveIcons } from "./app.js";
import { ZipEntry } from "./zip.js";


/** Reverse lookup table for decoding Base64 data.
 * It maps a ASCII charCode _minus 43_ to a 6-bit value. -1 means invalid.
 */
const BASE64_DEC_TABLE = new Uint8Array([
  62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,
  -1, -1, -1, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
  36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
]);

/** @return {!Uint8Array} The decoded bytes.
 * @param {string} data  A “data:…;base64,” URL.
 * ⚠️ This function is unsafe: it does no error checking ⚠️
 */
function decodeBase64DataURL(data) {
  console.assert(
    /^\s*data:[a-zA-Z0-9/%;=\s]*;\s*base64\s*,/.test(data),
    "Looks like a base64-encoded data URL", data
  );
  const start = data.indexOf(",") + 1;
  const len = data.length - start;
  console.assert(len % 4 === 0, "Length is a multiple of 4", len);
  let end = data.length - 1;
  const padlen = (data[end] === "=") ? (data[end - 1] === "=") ? 2 : 1 : 0;
  const out = new Uint8Array((len >> 1) + (len >> 2) - padlen);

  if (padlen !== 0) {
    end -= 4; // deal with full 4-char/24-bit chunks at first
  }
  for (var i = start, j = 0; i <= end; i += 4, j += 3) {
    const chunk = BASE64_DEC_TABLE[data.charCodeAt(i)     - 43] << 18
                | BASE64_DEC_TABLE[data.charCodeAt(i + 1) - 43] << 12
                | BASE64_DEC_TABLE[data.charCodeAt(i + 2) - 43] <<  6
                | BASE64_DEC_TABLE[data.charCodeAt(i + 3) - 43];
    out[j]     = chunk >> 16;
    out[j + 1] = chunk >>  8;
    out[j + 2] = chunk;
  }
  if (padlen !== 0) {
    let leftovers = BASE64_DEC_TABLE[data.charCodeAt(i)     - 43] << 12
                  | BASE64_DEC_TABLE[data.charCodeAt(i + 1) - 43] <<  6;
    out[j] = leftovers >> 10;
    if (padlen === 1) {
      leftovers |= BASE64_DEC_TABLE[data.charCodeAt(i + 2) - 43];
      out[j + 1] = leftovers >> 2;
    }
  }
  return out;
}


const SCALES = Object.freeze(
  // Sort to make the _displayed_ preview match devicePixelRatio:
  (self.devicePixelRatio <= 1)
   ? [4, 2, 1]
   : (self.devicePixelRatio <= 2)
      ? [1, 4, 2]
      : [1, 2, 4]
);

const /** !Object<string,!Uint8Array> */ icons = {};
const sourceImage = new Image;
const saveBtn = document.getElementById("save");
const downloadAllLink = saveBtn.nextElementSibling;
const outputElt = document.querySelector("output");
const extraOptionsElt = document.querySelector("form>div");
const silhouetteElt = extraOptionsElt.querySelector("input[type='checkbox']");
{
  const canvasColorElt = extraOptionsElt.querySelector("input[type='color']");
  const canvasColorSheet = document.styleSheets[document.styleSheets.length - 1];

  canvasColorElt.onchange = canvasColorElt.oninput = function() {
    if (canvasColorSheet.cssRules.length !== 0) {
      canvasColorSheet.deleteRule(0);
    }
    canvasColorSheet.insertRule(`canvas{background:${this.value}}`, 0);
  };
}

database.then(function() {
  saveBtn.onclick = saveIcons.bind(null, icons);
  saveBtn.disabled = false;
});

// An <a href="blob:…"> is non-sense (rightclick → “copy link URL”, get screwed
// because a Blob is short-lived).
// So to work around that: hide the download link and make a <button> click() it.
downloadAllLink.nextElementSibling.onclick = (document.documentMode !== undefined)
  ? function() { // navigating to a Blob doesn’t work on IE
    navigator.msSaveOrOpenBlob(zipAllIcons(), downloadAllLink.getAttribute("download"));
  }
  : function() {
    if (downloadAllLink.href === "") { // means new icons have been generated
      downloadAllLink.href = URL.createObjectURL(zipAllIcons());
    }
    downloadAllLink.click();
  };

/** @return {!Blob} A zip archive containing all the generated tile icons. */
function zipAllIcons() {
  const now = new Date;
  const zipEntries = [];

  for (const filename in icons) {
    zipEntries.push(new ZipEntry(filename, icons[filename], now));
  }
  return ZipEntry.toBlob(zipEntries);
}


document.querySelector("input[type='file']").onchange = function() {
  if (this.files.length === 0) return;

  if (this.files[0].size <= 5e6 || confirm(
    "⚠ The selected file weights more than 5 megabytes.\n" +
    "Your browser may freeze for a while during its processing."
  )) {
    sourceImage.src = URL.createObjectURL(this.files[0]);
  } else {
    this.value = null;
  }
};

sourceImage.onerror = function() {
  alert("☹ The selected file doesn’t seem to be a valid image.");
};

sourceImage.onload = silhouetteElt.onchange = function(evt) {
  if (sourceImage.width * sourceImage.height === 0) {
    alert(
      "☹ The selected image seems to have null dimensions.\n" +
      "Is it a SVG with no explicit ‘width’ or ‘height’ attribute?"
    ); // triggered by SVG with [viewBox] but no [width|height] on Firefox
  }

  URL.revokeObjectURL(sourceImage.src);

  if (downloadAllLink.href === "") {
    extraOptionsElt.hidden = outputElt.parentNode.hidden = false;
  } else {
    URL.revokeObjectURL(downloadAllLink.href);
    downloadAllLink.removeAttribute("href");
  }

  // (Try to) update the <input checkbox|file> status immediately
  // and only do the heavy work, which may freeze UI, after repaint:
  document.body.setAttribute("aria-busy", true);
  if (self.setImmediate !== undefined) {
    setImmediate(makeTiles);
  } else {
    setTimeout(makeTiles, 20);
  }
};

function makeTiles() {
  for (
    let tileElt = outputElt.firstElementChild;
    tileElt !== null;
    tileElt = tileElt.nextElementSibling
  ) {
    const canvasElt = tileElt.querySelector("canvas");
    const canvasCtx = canvasElt.getContext("2d");
    const width = canvasElt.dataset["width"];
    const height = canvasElt.dataset["height"];
    const innerWidth = width * canvasElt.dataset["innerWidthFraction"];
    const innerHeight = height * canvasElt.dataset["innerHeightFraction"];
    const x = (width - innerWidth) / 2;
    const y = (height - innerHeight) / 2;

    canvasCtx["imageSmoothingQuality"] = "high";
    for (let i = 0; i < SCALES.length; i++) {
      const scale = SCALES[i];

      draw_tile: {
        canvasElt.width = width * scale;
        canvasElt.height = height * scale;

        canvasCtx.scale(scale, scale);
        canvasCtx.drawImage(sourceImage, x, y, innerWidth, innerHeight);

        if (silhouetteElt.checked) {
          const scaledX = x * scale;
          const scaledY = y * scale;
          const imgData = canvasCtx.getImageData(
            scaledX, scaledY,
            Math.ceil(innerWidth + 1) * scale, Math.ceil(innerHeight + 1) * scale
          );
          const rgbαs = imgData.data;

          for (let i = 0; i < rgbαs.length; i += 4) {
            if (rgbαs[i + 3] !== 0) { // pixel not fully transparent…
              rgbαs[i] = rgbαs[i + 1] = rgbαs[i + 2] = 0xff; // …make it white
            }
          }
          canvasCtx.putImageData(imgData, scaledX, scaledY);
        }
      }
      link_and_add_to_dict: {
        const a = tileElt.querySelector(`a[download$="${scale * 100}.png"]`);
        const url = canvasElt.toDataURL("image/png");

        a.href = url;
        icons[a.getAttribute("download")] = decodeBase64DataURL(url);
        // Canvas#toBlob is not widely supported, and it + FileReader#readAsArrayBuffer
        // are async. With two levels of async, one of which possibly failing, both of
        // which involving (here) several callbacks, keeping state coherent is hard.
      }
    }
  }
  document.body.removeAttribute("aria-busy");
}
