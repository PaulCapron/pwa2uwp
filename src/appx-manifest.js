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

/** @return {!Object<string,(string|boolean|number)>} Converted manifest data.
 *  The keys are the same than the DOM <input> ids.
 * @param {!Object<string,(string,!Array,!Object)>} webAppManif  The W3C Web App Manifest data.
 *
 * It does not matter (much) if the resulting appx manifest data is actually invalid:
 * if the user then tries to submit the form, the built-in form validation will fail
 * and the browser will highlight/focus the invalid fields 😉
 * The data will probably be invalid, actually. For instance, a relative “start_url”
 * is allowed (and common, I guess) in a Web App Manifest, but it has to be absolute
 * in an Appx Manifest.
 */
function webAppManifestDictToAppxManifestDict(webAppManif) {
  let bgColor;
  {
    // A color in a W3C App Manifest can be given in any of the valid CSS3 color formats.
    // So things like “#rgb”, “hsl(…)”, “rgba(…)” (and also, in theory, ‘currentColor’
    // or the “system colors” like ‘HighlightText’ or ‘ButtonShadow’!) are all valid.
    // See https://www.w3.org/TR/appmanifest/#theme_color-member
    //
    // That’s not the case in an MSFT Appx Manifest, where a color has to be “#rrggbb”
    // or one of the “named colors” (the same than the CSS3 named colors, although I
    // don’t know if an appx manifest is case-sensitive on that matter.)
    // See https://docs.microsoft.com/uwp/schemas/appxpackage/uapmanifestschema/element-uap-visualelements
    //
    // And anyway, an <input type=color> only allows the “#rrggbb” format.
    //
    // So, we have to normalize the color to be in “#rrggbb” format.
    // Doing so manually would be a very daunting, very hazardous task.
    // But here is the trick: we can delegate that job to the browser!
    // See https://www.w3.org/TR/2dcontext/#serialization-of-a-color
    const canvasCtx = document.createElement("canvas").getContext("2d");

    canvasCtx.fillStyle = webAppManif.theme_color; // (intentionally not background_color)
    bgColor = canvasCtx.fillStyle; // serialization ⇒ normalization happens here!

    // If the color was not fully opaque, bgColor ends up being of the form “rgba(…)”.
    // This is an invalid value for an <input type=color>, so form validation will fail.
    // That’s OK: an appx manifest does not allow a non-opaque color either, unless it’s
    // ‘transparent’. But ‘transparent’ is invalid for an <input type=color>, so for
    // the time being, we also implicitely reject it 🙄…
    // It’s dubious to me if ‘transparent’ really makes sense in a manifest anyway.
  }

  let landscapeOrientation = false, portraitOrientation = false;
  let landscapeFlippedOrientation = false, portraitFlippedOrientation = false;

  // See https://www.w3.org/TR/appmanifest/#orientation-member
  // and https://www.w3.org/TR/screen-orientation/
  switch (webAppManif.orientation) {
  case "any": landscapeFlippedOrientation = portraitFlippedOrientation = true; // fallthrough!
  case "natural": landscapeOrientation = portraitOrientation = true; break;

  case "landscape": landscapeFlippedOrientation = true; // fallthrough!
  case "landscape-primary": landscapeOrientation = true; break;
  case "landscape-secondary": landscapeFlippedOrientation = true; break;

  case "portrait": portraitFlippedOrientation = true; // fallthrough!
  case "portrait-primary": portraitOrientation = true; break;
  case "portrait-secondary": portraitFlippedOrientation = true; break;
  }
  // If ‘orientation’ was not set in the Web App Manifest, no worry. As said on the page:
  // “Selecting none of them is equivalent to selecting all of them.” 😉

  return {
    bgColor,

    landscapeOrientation, portraitOrientation,
    landscapeFlippedOrientation, portraitFlippedOrientation,

    displayName: webAppManif.name || "",
    shortName: webAppManif.short_name || "",
    description: webAppManif.description || "",
    lang: webAppManif.lang || "",
    url: webAppManif.start_url || "",
  };
}


let /** string */ manifest;
const mainFormElt = document.forms[1];
const useSameIconPathsElt = mainFormElt.querySelector("input:not([id])");
const iconPathsElts = mainFormElt.querySelectorAll("input[id$='Logo']");

/** @param {!Object<string,(string|boolean|number)>} appxManif  The manifest to fill the DOM with.
 *  The keys are expected to be the same than the DOM <input> ids.
 */
function fillDomWithAppxManifestDict(appxManif) {
  for (const key in appxManif) {
    const val = appxManif[key];
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
}

savedManifest.then(function indexedDBIsSupported() {
  const saveBtn = mainFormElt.querySelector("output+button");

  saveBtn.disabled = false;
  saveBtn.onclick = function() { saveManifest(manifest); };
});

savedManifest.then(function(savedManif) {
  if (savedManif === undefined) return;
  if (mainFormElt.contains(document.activeElement)) return; // don’t mess with an interacting user

  fillDomWithAppxManifestDict(
    toDict(
      (new DOMParser).parseFromString(savedManif, "text/xml")
    )
  );
  // Display the “pre-filled” notice and reset button:
  mainFormElt.querySelector("[role='status']").hidden = false;
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

{
  const inputElts = mainFormElt.querySelectorAll("input[id]");
  const outputElt = mainFormElt.querySelector("output");
  const downloadLink = mainFormElt.querySelector("a[download]");
  const downloadBtn = downloadLink.nextElementSibling;

  mainFormElt.querySelector("button[type='submit']").disabled = false; // JS is enabled

  mainFormElt.onsubmit = function(evt) {
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
}

{
  const webAppManifForm = document.forms[0];
  const webAppManifDialog = webAppManifForm.parentNode;
  const webAppManifTextarea = webAppManifForm.querySelector("textarea");
  const webAppManifCancelBtn = webAppManifForm.querySelector("button[type='button']");
  const prefillUsingWebAppManifBtn = mainFormElt.querySelector("button[type='button']");

  prefillUsingWebAppManifBtn.disabled = false; // JS is enabled

  prefillUsingWebAppManifBtn.onclick = webAppManifCancelBtn.onclick = function() {
    if (this === prefillUsingWebAppManifBtn) {
      console.assert(!webAppManifDialog.hasAttribute("open"), "dialog not already opened");
      webAppManifDialog.setAttribute("open", "");
      webAppManifTextarea.focus();
    } else {
      webAppManifDialog.removeAttribute("open");
      prefillUsingWebAppManifBtn.focus();
    }
  };

  webAppManifForm.onsubmit = function(evt) {
    let webAppManifDict;

    try {
      webAppManifDict = JSON.parse(webAppManifTextarea.value);
    } catch (err) {
      alert("☹ The input does not seem to be valid JSON.\n" + err);
      return false;
    }

    const appxManifDict = webAppManifestDictToAppxManifestDict(webAppManifDict);

    provide_sensible_version_numbers: {
      const now = new Date;

      appxManifDict.majorVersion = now.getFullYear();
      appxManifDict.minorVersion = ((now.getMonth() + 1) * 100) + now.getDate();
      appxManifDict.buildVersion = (now.getHours() * 100) + now.getMinutes();
    }

    fillDomWithAppxManifestDict(appxManifDict);
    webAppManifCancelBtn.onclick(); // will switch between forms

    evt.preventDefault();
  };
}
