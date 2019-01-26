# The PWA2UWP toolkit

Browser-based tools to publish a Progressive Web App (PWA)
as an Universal Windows Platform (UWP) application.

## Usage

Simply open `src/index.html` in Firefox for local use.

Blink & WebKit browsers need an HTTP server, due to (over)restrictions
regarding `file:` origins.  
Running `cd src && python3 -m http.server` is an idea.

Old browsers, including Internet Explorer 11, only (partially) work
using the build, fit-for-distribution, website.

## Build

To build the fit-for-distribution website, run **`make`**.
The resulting content is put in `dst/`, ready to be uploaded to a webserver.

The build process requires an UNIX-like system, with
[GNU Make](https://www.gnu.org/software/make/) and a
[JRE](https://en.wikipedia.org/wiki/Java_virtual_machine) ≥ 8
installed.

Some third-party open-source JARs are also needed.
They are **automatically downloaded**, on first need, by `make`.  
(The `HTTPGET` environment variable defines the download command to execute.
It’s `curl` by default. `wget -O -` works too.)
These “development dependencies” are:

  * [**Saxon-HE 9.≥8**](http://saxon.sourceforge.net/#F9.9HE),
  a XSLT 2 processor, to embed CSS/JS code directly into the HTML & more.  
  Put in a `3p/` folder, named `saxon9he.jar`.
  On Ubuntu ≥ 18.04, you can `apt install` the `libsaxonhe-java` package,
  then symlink `/usr/share/java/Saxon-HE.jar` to `3p/saxon9he.jar`.

  * The [**Closure Compiler**](https://github.com/google/closure-compiler),
  to transpile and minify JavaScript code.  
  Put in `3p/`, named `closure-compiler.jar`.
  (⚠ The version available in Ubuntu package repositories is too old to work.)

  * The [**YUICompressor**](https://github.com/yui/yuicompressor), to minify
  CSS code. `htmlcompressor.jar` delegates that job to it.  
  Put in `3p/`, named `yuicompressor.jar`.

  * [**`htmlcompressor.jar`**](https://code.google.com/archive/p/htmlcompressor/),
  to minify HTML & XML code.
  Put in `3p/`, named `htmlcompressor.jar`.

## Hierarchy

  * `3p/`: contains the third-party dependencies needed to build
  the fit-for-distribution website.
  See the [Build](#Build) section for how to get them. Not tracked by `git`.

  * `dst/`: the build, fit-for-distribution, website content.
  Generated using `make`. Not tracked by `git`.

  * `src/`: the source website content. Kept simple, stupid.
  HTML is repeated, CSS skips classes, JS is modular ES6 that transpiles cheaply.

  * `GNUmakefile`: recipes to build the fit-for-distribution website.

  * `LICENSE.txt`: licensing/copyright information for this repository.
  Everything is [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

  * `netlify.toml`: configuration for hosting on [Netlify](https://www.netlify.com).
  The Netlify↔GitHub integration is not used; deploys are manual.

  * `postprod.xsl`: XSLT stylesheet used during the build process.

  * `README.md`: this file.
