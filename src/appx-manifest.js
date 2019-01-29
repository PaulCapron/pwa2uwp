/**
 * @file Generate a Windows 10 app package manifest for a web-based application.
 * @see appx-manifest.html The document this file scripts and depends on.
 * @see https://docs.microsoft.com/uwp/schemas/appxpackage/appx-package-manifest
 * @author Paul <paul@fragara.com>
 * @since 2018
 * @license CC0-1.0
 *  The author has dedicated all rights to this software to the public domain.
 *  This software is distributed without any warranty.
 */

import { savedManifest, saveManifest } from "./app.js";


/** The “mother” of all manifest documents.
 * It is itself immutable. It’s cloned each time the user submits the form;
 * the clone gets filled with <input> data, then it’s serialized to string.
 * ⚠ Whitespace is significant.
 * @const {Document}
 */
const MANIFEST_MOTHER = (new DOMParser).parseFromString(
`<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10">
  <Identity ProcessorArchitecture="neutral"/>
  <Properties>
    <DisplayName/>
    <PublisherDisplayName/>
    <Logo/>
  </Properties>
  <Applications>
    <Application Id="WebApp">
      <uap:VisualElements>
        <uap:DefaultTile>
          <uap:ShowNameOnTiles>
            <uap:ShowOn Tile="square150x150Logo"/>
            <uap:ShowOn Tile="square310x310Logo"/>
            <uap:ShowOn Tile="wide310x150Logo"/>
          </uap:ShowNameOnTiles>
        </uap:DefaultTile>
        <uap:InitialRotationPreference>
          <uap:Rotation Preference="landscape"/>
          <uap:Rotation Preference="portrait"/>
          <uap:Rotation Preference="landscapeFlipped"/>
          <uap:Rotation Preference="portraitFlipped"/>
        </uap:InitialRotationPreference>
      </uap:VisualElements>
      <uap:ApplicationContentUriRules>
        <uap:Rule Type="include" WindowsRuntimeAccess="all"/>
      </uap:ApplicationContentUriRules>
    </Application>
  </Applications>
  <Capabilities>
    <Capability Name="internetClient"/>
  </Capabilities>
  <Resources>
    <Resource/>
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.10240.0" MaxVersionTested="10.0.17763.0"/>
  </Dependencies>
</Package>`, "text/xml");


/** Generate a Windows 10 app package manifest.
 * ⚠ The caller is responsible for input validation.
 *
 * @param {!Object<string,(string|boolean|number)>} data  Data to fill the manifest.
 *  The keys are the same than the DOM <input> ids.
 * @return {string} The XML manifest, as a pretty-formatted string.
 */
function generateManifest(data) {
  const manif = MANIFEST_MOTHER.cloneNode(true);

  const identityElt = manif.querySelector("Identity");
  const displayNameElt = manif.querySelector("DisplayName");
  const publisherDisplayNameElt = manif.querySelector("PublisherDisplayName");
  const logoElt = manif.querySelector("Logo");
  const resourceElt = manif.querySelector("Resource");
  const appElt = manif.querySelector("Application");
  const uriRulesElt = appElt.querySelector("ApplicationContentUriRules");
  const ruleElt = uriRulesElt.querySelector("Rule");
  const visualElt = appElt.querySelector("VisualElements");
  const defaultTileElt = visualElt.querySelector("DefaultTile");
  const showNameOnTilesElt = defaultTileElt.querySelector("ShowNameOnTiles");
  const showOn310x310Elt = showNameOnTilesElt.querySelector("ShowOn[Tile='square310x310Logo']");
  const showOn310x150Elt = showOn310x310Elt.nextElementSibling;
  const rotPrefElt = visualElt.querySelector("InitialRotationPreference");
  const landscapeRotElt = rotPrefElt.firstElementChild;
  const portraitRotElt = landscapeRotElt.nextElementSibling;
  const landscapeFlippedRotElt = portraitRotElt.nextElementSibling;
  const portraitFlippedRotElt = landscapeFlippedRotElt.nextElementSibling;

  basics: {
    const { displayName, description, lang, url } = data;
    const { majorVersion, minorVersion, buildVersion, revisionVersion } = data;

    appElt.setAttribute("StartPage", url);
    resourceElt.setAttribute("Language", lang);
    visualElt.setAttribute("Description", description);
    visualElt.setAttribute("DisplayName", displayName);
    identityElt.setAttribute(
      "Version", `${majorVersion}.${minorVersion}.${buildVersion}.${revisionVersion}`
    );
    if (url.indexOf("https://") === 0) { // IE 11 doesn’t have “new URL()”
      const pathIndex = url.indexOf("/", "https://*".length);
      const origin = (pathIndex === -1) ? url : url.substring(0, pathIndex);

      ruleElt.setAttribute("Match", origin + "/*");
    } else {
      //TODO: check doc accurancy “http:// fails validation”. What about “ms-appx-web://”?
      appElt.removeChild(uriRulesElt.previousSibling); // whitespace text node
      appElt.removeChild(uriRulesElt);
    }
  }
  orientations: {
    const { landscapeOrientation, landscapeFlippedOrientation } = data;
    const { portraitOrientation, portraitFlippedOrientation } = data;

    if (!landscapeOrientation && !landscapeFlippedOrientation &&
        !portraitOrientation && !portraitFlippedOrientation) {
      /* No orientation explicitely given = all orientations are supported. */
    } else {
      if (!landscapeOrientation) {
        rotPrefElt.removeChild(landscapeRotElt.previousSibling); // whitespace text node
        rotPrefElt.removeChild(landscapeRotElt);
      }
      if (!landscapeFlippedOrientation) {
        rotPrefElt.removeChild(landscapeFlippedRotElt.previousSibling);
        rotPrefElt.removeChild(landscapeFlippedRotElt);
      }
      if (!portraitOrientation) {
        rotPrefElt.removeChild(portraitRotElt.previousSibling);
        rotPrefElt.removeChild(portraitRotElt);
      }
      if (!portraitFlippedOrientation) {
        rotPrefElt.removeChild(portraitFlippedRotElt.previousSibling);
        rotPrefElt.removeChild(portraitFlippedRotElt);
      }
    }
  }
  iconography: {
    const { storeLogo, square44x44Logo, square150x150Logo } = data;
    const { square71x71Logo, square310x310Logo, wide310x150Logo } = data;
    const { shortName, bgColor } = data;

    logoElt.textContent = storeLogo;
    visualElt.setAttribute("BackgroundColor", bgColor);
    visualElt.setAttribute("Square44x44Logo", square44x44Logo);
    visualElt.setAttribute("Square150x150Logo", square150x150Logo);

    if (!square71x71Logo && !square310x310Logo && !wide310x150Logo && !shortName) {
      visualElt.removeChild(defaultTileElt.previousSibling); // whitespace text node
      visualElt.removeChild(defaultTileElt);
    } else {
      if (square71x71Logo) defaultTileElt.setAttribute("Square71x71Logo", square71x71Logo);
      if (square310x310Logo) defaultTileElt.setAttribute("Square310x310Logo", square310x310Logo);
      if (wide310x150Logo) defaultTileElt.setAttribute("Wide310x150Logo", wide310x150Logo);

      if (shortName) {
        defaultTileElt.setAttribute("ShortName", shortName);
        if (!square310x310Logo) {
          showNameOnTilesElt.removeChild(showOn310x310Elt.previousSibling); // whitespace text node
          showNameOnTilesElt.removeChild(showOn310x310Elt);
        }
        if (!wide310x150Logo) {
          showNameOnTilesElt.removeChild(showOn310x150Elt.previousSibling); // whitespace text node
          showNameOnTilesElt.removeChild(showOn310x150Elt);
        }
      } else {
        defaultTileElt.removeChild(showNameOnTilesElt.previousSibling); // whitespace text node
        defaultTileElt.removeChild(showNameOnTilesElt);
      }
    }
  }
  microsoft_store_ids: {
    const { publisher, publisherDisplayName, reservedName, pkgIdentityName } = data;

    displayNameElt.textContent = reservedName;
    publisherDisplayNameElt.textContent = publisherDisplayName;
    identityElt.setAttribute("Name", pkgIdentityName);
    identityElt.setAttribute("Publisher", publisher);
  }
  return (new XMLSerializer).serializeToString(manif) + "\n";
}

/** @return {!Object<string,(string|boolean|number)>} Extracted data from the manifest.
 *  The keys are the same than the DOM <input> ids.
 * @param {!Document} manifest  The manifest to read.
 *
 * This function is basically the inverse of generateManifest().
 */
function toDict(manifest) {
  const identityElt = manifest.querySelector("Identity");
  const visualElt = manifest.querySelector("VisualElements");
  const defaultTileElt = visualElt.querySelector("DefaultTile");
  const versionNumbers = identityElt.getAttribute("Version").split(".");

  return {
    majorVersion: Number(versionNumbers[0]),
    minorVersion: Number(versionNumbers[1]),
    buildVersion: Number(versionNumbers[2]),
    revisionVersion: Number(versionNumbers[3]),

    reservedName: manifest.querySelector("DisplayName").textContent,
    storeLogo: manifest.querySelector("Logo").textContent,
    publisherDisplayName: manifest.querySelector("PublisherDisplayName").textContent,
    url: manifest.querySelector("Application").getAttribute("StartPage"),
    lang: manifest.querySelector("Resource").getAttribute("Language"),

    publisher: identityElt.getAttribute("Publisher"),
    pkgIdentityName: identityElt.getAttribute("Name"),

    displayName: visualElt.getAttribute("DisplayName"),
    description: visualElt.getAttribute("Description"),
    bgColor: visualElt.getAttribute("BackgroundColor"),
    square44x44Logo: visualElt.getAttribute("Square44x44Logo"),
    square150x150Logo: visualElt.getAttribute("Square150x150Logo"),

    landscapeOrientation: (visualElt.querySelector("Rotation[Preference='landscape']") !== null),
    portraitOrientation: (visualElt.querySelector("Rotation[Preference='portrait']") !== null),
    landscapeFlippedOrientation:
      (visualElt.querySelector("Rotation[Preference='landscapeFlipped']") !== null),
    portraitFlippedOrientation:
      (visualElt.querySelector("Rotation[Preference='portraitFlipped']") !== null),

    square71x71Logo: defaultTileElt && defaultTileElt.getAttribute("Square71x71Logo") || "",
    square310x310Logo: defaultTileElt && defaultTileElt.getAttribute("Square310x310Logo") || "",
    wide310x150Logo: defaultTileElt && defaultTileElt.getAttribute("Wide310x150Logo") || "",
    shortName: defaultTileElt && defaultTileElt.getAttribute("ShortName") || "",
  }
}


let /** string */ manifest;
const formElt = document.forms[0];
const inputElts = formElt.querySelectorAll("input[id]");
const useSameIconPathsElt = formElt.querySelector("input:not([id])");
const iconPathsElts = formElt.querySelectorAll("input[id$='Logo']");
const outputElt = formElt.querySelector("output");
const saveBtn = outputElt.nextElementSibling;
const downloadLink = saveBtn.nextElementSibling;
const downloadBtn = downloadLink.nextElementSibling;

formElt.querySelector("button[type='submit']").disabled = false; // JS is enabled

savedManifest.then(function(savedManif) {
  saveBtn.disabled = false;
  saveBtn.onclick = function() { saveManifest(manifest); };

  reflect_in_dom: {
    if (savedManif === undefined) return;
    if (formElt.contains(document.activeElement)) return; // don’t mess with an interacting user

    const data = toDict((new DOMParser).parseFromString(savedManif, "text/xml"));

    for (const key in data) {
      const val = data[key];
      const prop = (typeof val === "boolean") ? "checked" : "value";

      document.getElementById(key)[prop] = val;
    }
    for (let i = 0; i < iconPathsElts.length; i++) {
      const pathElt = iconPathsElts[i];

      if (pathElt.value !== pathElt.getAttribute("value")) { // not the default value
        useSameIconPathsElt.checked = false;
        useSameIconPathsElt.onchange(); // will make pathElt & its siblings read-write
        break;
      }
    }
    formElt.firstElementChild.hidden = false; // display the “pre-filled” notice with reset button
  }
});

useSameIconPathsElt.onchange = function() {
  for (let i = 0; i < iconPathsElts.length; i++) {
    const inputElt = iconPathsElts[i];

    inputElt.readOnly = this.checked;
    if (this.checked) {
      inputElt.value = inputElt.getAttribute("value"); // reset to initial/default
    }
  }
};

// An <a href="blob:…"> is non-sense (rightclick → “copy link URL”, get screwed
// because a Blob is short-lived).
// So to work around that: hide the download link and make a <button> click() it.
downloadBtn.onclick = (document.documentMode !== undefined)
  ? function() { // navigating to a Blob doesn’t work on IE
    navigator.msSaveOrOpenBlob(
      new Blob([manifest], { "type": "text/xml", "endings": "native" }),
      downloadLink.getAttribute("download")
    );
  }
  : function() {
    if (downloadLink.href === "") { // means a new manifest has been generated
      downloadLink.href = URL.createObjectURL(
        new Blob([manifest], { "type": "text/xml", "endings": "native" })
      );
    }
    downloadLink.click();
  };

formElt.onsubmit = function(evt) {
  const inputData = {};

  for (let i = 0; i < inputElts.length; i++) {
    const elt = inputElts[i];

    inputData[elt.id] = (elt.type === "checkbox")
      ? elt.checked
      : (elt.type === "number")
         ? Number(elt.value) // IE & Edge<17.17681 don’t have valueAsNumber
         : elt.value;
  }

  outputElt.textContent = manifest = generateManifest(inputData);

  if (downloadLink.href === "") {
    outputElt.parentNode.hidden = false;
  } else {
    URL.revokeObjectURL(downloadLink.href);
    downloadLink.removeAttribute("href");
  }
  outputElt.focus({ "preventScroll": true });
  downloadBtn.scrollIntoView({ "behavior": "smooth", "block": "end" });

  evt.preventDefault();
};
