/**
 * @file Generate a Windows 10 app package manifest for a web-based application.
 * @see https://docs.microsoft.com/uwp/schemas/appxpackage/appx-package-manifest
 * @author Paul <paul@fragara.com>
 * @license CC0-1.0
 *  The author has dedicated all rights to this software to the public domain.
 *  This software is distributed without any warranty.
 */

import { database, saveManifest } from "./app.js";


/** The “mother” of all manifest documents.
 * It is itself immutable. We clone it everytime we generate a manifest.
 * That’s a bit inefficient, but this avoids state incoherencies.
 * @const {Document}
 */
const MANIFEST_MOTHER = (new DOMParser).parseFromString(
`<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10">
  <Identity Name="" Publisher="" Version="" ProcessorArchitecture="neutral"/>
  <Properties>
    <DisplayName/>
    <PublisherDisplayName/>
    <Logo/>
  </Properties>
  <Applications>
    <Application Id="" StartPage="">
      <uap:VisualElements DisplayName="" Description=""  BackgroundColor="" Square150x150Logo="" Square44x44Logo="">
        <uap:InitialRotationPreference>
          <uap:Rotation Preference="landscape"/>
          <uap:Rotation Preference="portrait"/>
          <uap:Rotation Preference="landscapeFlipped"/>
          <uap:Rotation Preference="portraitFlipped"/>
        </uap:InitialRotationPreference>
      </uap:VisualElements>
      <uap:ApplicationContentUriRules>
        <uap:Rule Type="include" WindowsRuntimeAccess="all" Match=""/>
      </uap:ApplicationContentUriRules>
    </Application>
  </Applications>
  <Capabilities>
    <Capability Name="internetClient"/>
  </Capabilities>
  <Resources>
    <Resource Language=""/>
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.10240.0" MaxVersionTested="10.0.17763.0"/>
  </Dependencies>
</Package>`, "text/xml");


/** Used to “stringify” manifest documents.
 * @const {!XMLSerializer}
 */
const serializer = new XMLSerializer;


/** Generate a Windows 10 app package manifest.
 * ⚠ The caller is responsible for input validation.
 *
 * @param {!Object<string,(string|boolean|number)>} data  Data to fill the manifest.
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
  const rotPrefElt = visualElt.querySelector("InitialRotationPreference");
  const landscapeRotElt = rotPrefElt.firstElementChild;
  const portraitRotElt = landscapeRotElt.nextElementSibling;
  const landscapeFlippedRotElt = portraitRotElt.nextElementSibling;
  const portraitFlippedRotElt = landscapeFlippedRotElt.nextElementSibling;

  fill_orientations: {
    const { landscapeOrientation, landscapeFlippedOrientation } = data;
    const { portraitOrientation, portraitFlippedOrientation } = data;

    if (!landscapeOrientation && !landscapeFlippedOrientation &&
        !portraitOrientation && !portraitFlippedOrientation) {
      /* No orientation explicitely given = all orientations are supported. */
    } else {
      if (!landscapeOrientation) {
        rotPrefElt.removeChild(landscapeRotElt.previousSibling);
        rotPrefElt.removeChild(landscapeRotElt);
      }
      if (!landscapeFlippedOrientation) {
        rotPrefElt.removeChild(landscapeFlippedRotElt.previousSibling);
        rotPrefElt.removeChild(landscapeFlippedRotElt);
      }
      if (!portraitOrientation) {
        rotPrefElt.removeChild(portraitRotElt.previousSibling); // whitespace text node
        rotPrefElt.removeChild(portraitRotElt);
      }
      if (!portraitFlippedOrientation) {
        rotPrefElt.removeChild(portraitFlippedRotElt.previousSibling);
        rotPrefElt.removeChild(portraitFlippedRotElt);
      }
    }
  }
  fill_iconography: {
    const { storeLogoPath, square44x44LogoPath, square150x150LogoPath, bgColor } = data;

    logoElt.textContent = storeLogoPath;
    visualElt.setAttribute("Square44x44Logo", square44x44LogoPath);
    visualElt.setAttribute("Square150x150Logo", square150x150LogoPath);
    visualElt.setAttribute("BackgroundColor", bgColor);
  }
  fill_microsoft_store_ids: {
    const { publisher, publisherDisplayName, reservedName, pkgIdentityName } = data;

    displayNameElt.textContent = reservedName;
    publisherDisplayNameElt.textContent = publisherDisplayName;
    identityElt.setAttribute("Name", pkgIdentityName);
    identityElt.setAttribute("Publisher", publisher);
  }
  fill_the_rest: {
    const { displayName, description, lang, url } = data;
    const { majorVersion, minorVersion, buildVersion, revisionVersion } = data;

    if (url.indexOf("https://") === 0) {
      const pathIndex = url.indexOf("/", "https://*".length);

      ruleElt.setAttribute(
        "Match",
        ((pathIndex === -1) ? url : url.substring(0, pathIndex)) + "/*"
      );
    } else {
      //TODO: check doc accurancy “http:// fails validation”. What about “ms-appx-web://”?
      appElt.removeChild(uriRulesElt.previousSibling); // whitespace text node
      appElt.removeChild(uriRulesElt);
    }
    appElt.setAttribute("StartPage", url);
    appElt.setAttribute("Id", "WebApp"); // has to be unique only within the pkg
    resourceElt.setAttribute("Language", lang);
    visualElt.setAttribute("Description", description);
    visualElt.setAttribute("DisplayName", displayName);
    identityElt.setAttribute(
      "Version",
      `${majorVersion}.${minorVersion}.${buildVersion}.${revisionVersion}`
    );
  }
  return serializer.serializeToString(manif) + "\n";
}


let /** string */ manifest;
const formElt = document.forms[0];
const inputElts = formElt.querySelectorAll("input");
const outputElt = formElt.querySelector("output");
const saveBtn = outputElt.nextElementSibling;
const downloadLink = saveBtn.nextElementSibling;
const downloadBtn = downloadLink.nextElementSibling;

formElt.querySelector("button[type='submit']").disabled = false;

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
