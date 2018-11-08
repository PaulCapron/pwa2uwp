#!/bin/sh
#
# grab-3p-deps.sh: download, if missing, the third-party dependencies
# needed to build the fit-for-distribution version of the PWA2UWP website.
#
# This script operates in the current working directory.
#
# To test if a dependency is present, only the filename is considered.
# And there is some freedom in that, to cope with versioned filenames.
#
set -Ceu
exec <&-

download() {
    if [ -x "$(command -v wget)" ]; then
        wget --quiet --show-progress --continue "$1"
    elif [ -x "$(command -v curl)" ]; then
        curl --location --remote-name --continue - "$1"
    elif [ -x "$(command -v fetch)" ]; then
        fetch --restart "$1" # FreeBSD, probably
    else
        echo "$0: you have neither ‘wget’ nor ‘curl’ nor ‘fetch’: cannot download ☹" >&2
        exit 2
    fi
}

download_extract() {
    download "$1"
    if [ -x "$(command -v jar)" ]; then
        jar xf "$(basename "$1")" "$2"
    elif [ -x "$(command -v unzip)" ]; then
        unzip "$(basename "$1")" "$2"
    else
        echo "$0: you have neither ‘jar’ nor ‘unzip’: cannot extract ☹" >&2
        exit 2
    fi
    rm "$(basename "$1")"
}

[ -f saxon9he.jar ] || download_extract "https://downloads.sourceforge.net/project/saxon/Saxon-HE/9.8/SaxonHE9-8-0-12J.zip" saxon9he.jar
echo "$0: saxon9he.jar: OK"

[ -f closure-compiler*.jar ] || download_extract "https://dl.google.com/closure-compiler/compiler-20181008.zip" closure-compiler-v20181008.jar
echo "$0: closure-compiler*.jar: OK"

[ -f htmlcompressor*.jar ] || download "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/htmlcompressor/htmlcompressor-1.5.3.jar"
echo "$0: htmlcompressor*.jar: OK"

[ -f yuicompressor*.jar ] || download "https://github.com/yui/yuicompressor/releases/download/v2.4.8/yuicompressor-2.4.8.jar"
echo "$0: yuicompressor*.jar: OK"

if ! [ -x "$(command -v java)" ]; then
    echo "$0: ⚠ You do not seem to have a Java Runtime Environment."
    echo "$0: ⚠ You will need to install one. Any JRE ≥ 8 should work."
    exit 1
fi >&2

echo "$0: all good! ☺"
