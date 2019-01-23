/**
 * @file Global setup and access to the shared IndexedDB database.
 * @module
 *
 * @see https://developer.mozilla.org/docs/Web/API/IndexedDB_API
 * @author Paul <paul@fragara.com>
 * @since 2018
 * @license CC0-1.0
 *  The author has dedicated all rights to this software to the public domain.
 *  This software is distributed without any warranty.
 */


if (self.indexedDB === undefined || self.Blob === undefined) {
  alert("⚠ Degraded service: your browser does not support IndexedDB and/or Blob.");
}

if (self.Promise === undefined) { // IE…
  self.Promise = class { // non-conforming limited polyfill
    /** @param {function(function(*),function(*))} executor */
    constructor(executor) {
      this.done_ = false;
      this.value_ = undefined;
      this.callbacks_ = [];

      const end = (val) => {
        this.done_ = true;
        this.value_ = val;
        for (let i = 0; i < this.callbacks_.length; i++) {
          this.callbacks_[i](val);
        }
        this.callbacks_.length = 0;
      };
      try { executor(end, end); } catch (err) { end(err); }
    }

    /** @param {function(*)} onFulfilled */
    then(onFulfilled) {
      (this.done_)
        ? onFulfilled(this.value_)
        : this.callbacks_.push(onFulfilled);
    }

    /** @return {!Promise<!Array>}
     * @param {!Array<!Promise>} proms
     */
    static all(proms) {
      return new Promise(function(resolve, reject) {
        let remains = proms.length;
        const results = new Array(remains);

        for (let i = 0; i < proms.length; i++) {
          proms[i].then(function(val) {
            results[i] = val;
            if (remains-- === 1) resolve(results);
          });
        }
      });
    }
  };
}


/** Reflect the database status (“are the icons or manifest present?”) in the DOM.
 * @param {!NodeList} elts  The DOM elements acting as status indicators.
 * @param {boolean} present
 * @param {boolean} animate
 */
function setStatus(elts, present, animate) {
  for (let i = 0; i < elts.length; i++) {
    const elt = elts[i];

    elt.classList.add((elt.textContent = (present) ? "ok" : "miss"));
    elt.classList.remove((present) ? "miss" : "ok");
    if (animate) {
      console.assert(elts.length === 1, "Animate only one element", elts);

      elt.addEventListener( // elt.onanimationend does not work in Chrome (!?)
        "animationend", function() { this.classList.remove("anim"); }, { "once": true }
      );
      elt.classList.add("anim");
      elt.setAttribute("role", "status");

      const pkgLink = elt.parentNode.parentNode;
      pkgLink.focus();
    }
  }
}

const setIconsStatus = setStatus.bind(null, document.getElementsByClassName("iconstatus"));
const setManifestStatus = setStatus.bind(null, document.getElementsByClassName("manifeststatus"));


/** @const {!Promise<!IDBDatabase>} The IndexedDB database named “pkg”. */
export const database = new Promise(function(resolve, reject) {
  const open = indexedDB.open("pkg", 1);

  open.onerror = function() {
    console.error("Could not open IndexedDB database:", this.error.message);
    reject(this.error.message);
  };
  open.onupgradeneeded = function() {
    this.result.createObjectStore("icons");
    this.result.createObjectStore("manifest");
  };
  open.onsuccess = function() {
    const db = this.result;

    db.onerror = function(evt) {
      console.error("IndexedDB database error:", evt.target.error.message);
    };

    // N.B.: iOS 9.3 needs one distinct transaction per store
    db.transaction("icons").objectStore("icons").count().onsuccess = function() {
      setIconsStatus(this.result >= 6, false);
    };
    db.transaction("manifest").objectStore("manifest").count().onsuccess = function() {
      setManifestStatus(this.result === 1, false);
    };

    resolve(db);
  };
});


/** @const {!Promise<!Object<string,!Uint8Array>>} The tile icons stored in the database.
 * The object will be empty if no icon are stored.
 */
export const savedIcons = new Promise(function(resolve, reject) {
  database.then(function(db) {
    const icons = {};

    db.transaction("icons")
      .objectStore("icons")
      .openCursor()
      .onsuccess = function() {
        const cursor = this.result;

        if (cursor === null) { // finished
          resolve(Object.freeze(icons));
          return;
        }
        icons[cursor.key] = cursor.value;
        cursor.continue();
      };
  });
});

/** @const {!Promise<string|undefined>} The appx manifest stored in the database. */
export const savedManifest = new Promise(function(resolve, reject) {
  database.then(function(db) {
    db.transaction("manifest")
      .objectStore("manifest")
      .get("manifest")
      .onsuccess = function() { resolve(this.result); };
  });
});


/** @param {!Object<string,!Uint8Array>} icons  The tile icons to store in the database. */
export function saveIcons(icons) {
  database.then(function(db) {
    const tx = db.transaction("icons", "readwrite");
    const store = tx.objectStore("icons");

    tx.oncomplete = setIconsStatus.bind(null, true, true);
    tx.onabort = function() { alert("☹ Could not add to the database:\n" + this.error); };
    for (const filename in icons) {
      store.put(icons[filename], filename);
    }
  });
};

/** @param {string} manifest  The appx manifest to store in the database. */
export function saveManifest(manifest) {
  database.then(function(db) {
    const tx = db.transaction("manifest", "readwrite");

    tx.oncomplete = setManifestStatus.bind(null, true, true);
    tx.onabort = function() { alert("☹ Could not add to the database:\n" + this.error); };
    tx.objectStore("manifest").put(manifest, "manifest");
  });
};
