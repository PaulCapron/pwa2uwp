# The PWA2UWP toolkit

Browser-based tools to publish a Progressive Web App (PWA)
as an Universal Windows Platform (UWP) application.

## Usage

Simply open `src/index.html` in Firefox (or Edge?) for local use.

Blink & WebKit browsers need an HTTP server due to (over)restrictions 
regarding `file:` origins.  
`cd src && python3 -m http.server` is an idea.

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
They can be **automatically downloaded** by running **`make deps`**.  
These third-party “development” dependencies are:

  * [**Saxon-HE 9.8**](http://saxon.sourceforge.net/#F9.8HE),
  a XSLT 2 processor, to embed CSS/JS code directly into the HTML & more.  
  Put in the `aux/` folder, named `saxon9he.jar`.  
  On Ubuntu, you can `apt install` the `libsaxonhe-java` package,
  then symlink `/usr/share/java/Saxon-HE.jar` to `aux/saxon9he.jar`.

  * The [**Closure Compiler**](https://github.com/google/closure-compiler),
  to transpile and minify JavaScript code.  
  Put in `aux/`, named `closure-compiler*.jar`.  
  (⚠ The version available in Ubuntu package repositories is too old to work.)

  * The [**YUICompressor**](https://github.com/yui/yuicompressor), to minify
  CSS code.
  Put in `aux/`, named `yuicompressor*.jar`.

  * [**`htmlcompressor.jar`**](https://code.google.com/archive/p/htmlcompressor/),
  to minify HTML & XML code.
  Put in `aux/`, named `htmlcompressor*.jar`.

## Hierarchy

  * `aux/`: auxiliary tools used to build the fit-for-distribution website.  
  Contains third-party dependencies not bundled with this repository.
  See the [Build](#Build) section for how to get them.

  * `dst/`: the build, fit-for-distribution, website content.  
  Generated using `make`. Not tracked by `git`.

  * `src/`: the source website content.  
  Kept simple, stupid. HTML is repeated, CSS skips classes, JS is modular ES6
  that transpiles cheaply.

  * `GNUmakefile`: recipes to build the fit-for-distribution website.

  * `LICENSE.txt`: licensing/copyright information for this repository.
  Everything is [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

  * `netlify.toml`: configuration for hosting on [Netlify](https://www.netlify.com).
  Deploys are done manually.

  * `README.md`: this file.
