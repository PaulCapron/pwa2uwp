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

// Regarding the naming of functions, see
// https://tomforsyth1000.github.io/blog.wiki.html#%5B%5BMatrix%20maths%20and%20names%5D%5D


/** @return {!Document} The appx manifest, an XML document.
 * @param {!Object<string,(string|boolean|number)>} appxDict  Data to fill the manifest.
 *  The keys are the same than the DOM <input> ids.
 *  ⚠ The caller is responsible for input validation.
 */
function appxManifDocFromDict(appxDict) {
  const manif = (new DOMParser).parseFromString(
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
    const { displayName, description, lang, url } = appxDict;
    const { majorVersion, minorVersion, buildVersion, revisionVersion } = appxDict;

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
    const { landscapeOrientation, landscapeFlippedOrientation } = appxDict;
    const { portraitOrientation, portraitFlippedOrientation } = appxDict;

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
    const { storeLogo, square44x44Logo, square150x150Logo } = appxDict;
    const { square71x71Logo, square310x310Logo, wide310x150Logo } = appxDict;
    const { shortName, bgColor } = appxDict;

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
    const { publisher, publisherDisplayName, reservedName, pkgIdentityName } = appxDict;

    displayNameElt.textContent = reservedName;
    publisherDisplayNameElt.textContent = publisherDisplayName;
    identityElt.setAttribute("Name", pkgIdentityName);
    identityElt.setAttribute("Publisher", publisher);
  }
  return manif;
}

/** @return {!Object<string,(string|boolean|number)>} Extracted data from the manifest document.
 *  The keys are the same than the DOM <input> ids.
 * @param {!Document} appxDoc  The manifest document to read.
 *
 * This function is the inverse of appxManifDocFromDict().
 */
function appxManifDictFromDoc(appxDoc) {
  const identityElt = appxDoc.querySelector("Identity");
  const visualElt = appxDoc.querySelector("VisualElements");
  const defaultTileElt = visualElt.querySelector("DefaultTile");
  const versionNumbers = identityElt.getAttribute("Version").split(".");

  return {
    majorVersion: Number(versionNumbers[0]),
    minorVersion: Number(versionNumbers[1]),
    buildVersion: Number(versionNumbers[2]),
    revisionVersion: Number(versionNumbers[3]),

    reservedName: appxDoc.querySelector("DisplayName").textContent,
    storeLogo: appxDoc.querySelector("Logo").textContent,
    publisherDisplayName: appxDoc.querySelector("PublisherDisplayName").textContent,
    url: appxDoc.querySelector("Application").getAttribute("StartPage"),
    lang: appxDoc.querySelector("Resource").getAttribute("Language"),

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

/** @return {!Object<string,(string|boolean|number)>} Manifest data converted to Appx format.
 *  The keys are the same than the DOM <input> ids.
 * @param {!Object<string,(string,!Array,!Object)>} webDict  The W3C Web App Manifest data.
 *
 * It does not matter (much) if the resulting appx manifest data is actually invalid:
 * if the user then tries to submit the form, the built-in form validation will fail
 * and the browser will highlight/focus the invalid fields 😉
 * The data will probably be invalid, actually. For instance, a relative “start_url”
 * is allowed (and common, I guess) in a Web App Manifest, but it has to be absolute
 * in an Appx Manifest.
 */
function appxManifDictFromWebAppManifDict(webDict) {
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

    canvasCtx.fillStyle = webDict.theme_color; // (intentionally not background_color)
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
  switch (webDict.orientation) {
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

    displayName: webDict.name || "",
    shortName: webDict.short_name || "",
    description: webDict.description || "",
    lang: webDict.lang || "",
    url: webDict.start_url || "",
  };
}


let /** string */ manifest;
const mainFormElt = document.forms[1];

savedManifest.then(function indexedDBIsSupported() {
  const saveBtn = mainFormElt.querySelector("output+button");

  saveBtn.disabled = false;
  saveBtn.onclick = function() { saveManifest(manifest); };
});

{
  const useSameIconPathsElt = mainFormElt.querySelector("input:not([id])");
  const iconPathsElts = mainFormElt.querySelectorAll("input[id$='Logo']");

  /** @param {boolean} areWritable  Whether the icon path <input>s shall be writable or read-only. */
  function setIconPathsWritability(areWritable) {
    for (let i = 0; i < iconPathsElts.length; i++) {
      iconPathsElts[i].readOnly = !areWritable;
    }
  }

  useSameIconPathsElt.onchange = function() { setIconPathsWritability(!this.checked); };

  savedManifest.then(function(savedManif) {
    if (savedManif === undefined) return;
    if (mainFormElt.contains(document.activeElement)) return; // don’t mess with an interacting user

    const appxManifDict = appxManifDictFromDoc(
      (new DOMParser).parseFromString(savedManif, "text/xml")
    );

    for (const key in appxManifDict) {
      const val = appxManifDict[key];
      const prop = (typeof val === "boolean") ? "checked" : "value";

      document.getElementById(key)[prop] = val;
    }
    for (let i = 0; i < iconPathsElts.length; i++) {
      const pathElt = iconPathsElts[i];

      if (pathElt.value !== pathElt.getAttribute("value")) { // not the default value
        useSameIconPathsElt.checked = false;
        setIconPathsWritability(true);
        break;
      }
    }

    mainFormElt.onreset = setIconPathsWritability.bind(null, false);

    // Display the “pre-filled” notice and reset button:
    mainFormElt.querySelector("[role='status']").hidden = false;
  });
}

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

    outputElt.textContent = manifest = (new XMLSerializer).serializeToString(
      appxManifDocFromDict(inputData)
    ) + "\n";

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

    const appxManifDict = appxManifDictFromWebAppManifDict(webAppManifDict);

    provide_sensible_version_numbers: {
      const now = new Date;

      appxManifDict.majorVersion = now.getFullYear();
      appxManifDict.minorVersion = ((now.getMonth() + 1) * 100) + now.getDate();
      appxManifDict.buildVersion = (now.getHours() * 100) + now.getMinutes();
    }

    for (const key in appxManifDict) {
      const val = appxManifDict[key];
      const prop = (typeof val === "boolean") ? "checked" : "value";

      document.getElementById(key)[prop] = val;
    }

    webAppManifDialog.removeAttribute("open");
    prefillUsingWebAppManifBtn.focus();

    evt.preventDefault();
  };
}
