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

import { database, saveManifest } from "./app.js";


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
        <uap:DefaultTile/>
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
    const { storeLogo, square44x44Logo, square150x150Logo, bgColor } = data;
    const { square71x71Logo, square310x310Logo, wide310x150Logo } = data;

    logoElt.textContent = storeLogo;
    visualElt.setAttribute("BackgroundColor", bgColor);
    visualElt.setAttribute("Square44x44Logo", square44x44Logo);
    visualElt.setAttribute("Square150x150Logo", square150x150Logo);

    if (!square71x71Logo && !square310x310Logo && !wide310x150Logo) {
      visualElt.removeChild(defaultTileElt.previousSibling); // whitespace text node
      visualElt.removeChild(defaultTileElt);
    } else {
      if (square71x71Logo) defaultTileElt.setAttribute("Square71x71Logo", square71x71Logo);
      if (square310x310Logo) defaultTileElt.setAttribute("Square310x310Logo", square310x310Logo);
      if (wide310x150Logo) defaultTileElt.setAttribute("Wide310x150Logo", wide310x150Logo);
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


let /** string */ manifest;
const formElt = document.forms[0];
const inputElts = formElt.querySelectorAll("input");
const outputElt = formElt.querySelector("output");
const saveBtn = outputElt.nextElementSibling;
const downloadLink = saveBtn.nextElementSibling;
const downloadBtn = downloadLink.nextElementSibling;

formElt.querySelector("button[type='submit']").disabled = false;

document.getElementById("useOwnIconPaths").onchange = function() {
  for (
    let inputElt, labelElt = this.parentNode.nextElementSibling;
    labelElt !== null && (inputElt = labelElt.firstElementChild);
    labelElt = labelElt.nextElementSibling
  ) {
    inputElt.readOnly = this.checked;
    if (this.checked) {
      inputElt.value = inputElt.getAttribute("value"); // reset to initial
    }
  }
};

database.then(function() {
  saveBtn.disabled = false;
  saveBtn.onclick = function() { saveManifest(manifest); };
});

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
