#!/bin/bash

SCRIPT_DIR="$(dirname "$(realpath "$0")")"

cd "$SCRIPT_DIR/../db" || exit

# cp assets/s3e1.png db/inout.png
echo -n > pixels.log
echo "0;0;112;112;0;0;COLORS" > expands.log
npm run tools recover
