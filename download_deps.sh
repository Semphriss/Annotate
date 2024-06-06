#!/bin/bash

# Downloads Mozilla's pdfjs and PDF-LIB releases.

# pdfjs version is old because newer versions use newer features that Morph doesn't support
PDFJS_VERSION=2.16.105
PDFLIB_VERSION=1.17.1

set -e

for cmd in mktemp realpath dirname cd wget unzip cp rm tar sha256sum; do
  if [ "$(command -v $cmd)" = "" ]; then
    echo "Command '$cmd' not found" >&2
    exit 1
  fi
done

TEMP_WD="$(mktemp -d)"
REPO_ROOT="$(realpath "$(dirname "$0")")"

# pdf.js
cd "$TEMP_WD"
wget "https://github.com/mozilla/pdf.js/releases/download/v$PDFJS_VERSION/pdfjs-$PDFJS_VERSION-legacy-dist.zip"
unzip "pdfjs-$PDFJS_VERSION-legacy-dist.zip"
cp build/pdf.js build/pdf.worker.js "$REPO_ROOT"/www/

# pdf-lib
rm -rf "$TEMP_WD"/*
wget "https://github.com/Hopding/pdf-lib/releases/download/v$PDFLIB_VERSION/pdf-lib-v$PDFLIB_VERSION.tgz"
tar -xaf "pdf-lib-v$PDFLIB_VERSION.tgz"
cp package/dist/pdf-lib.esm.min.js "$REPO_ROOT"/www/

cd "$REPO_ROOT"/www/
rm -rf "$TEMP_WD"

# Checksum to detect tampering
sha256sum -c ../deps.sha256
