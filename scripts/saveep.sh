#!/bin/bash

if [ $# -eq 0 ]; then
    echo "$0 s9e9"
    exit 1
fi

SEASON_EPISODE=$1
SCRIPT_DIR="$(dirname "$(realpath "$0")")"

cd "$SCRIPT_DIR/../db" || exit

mkdir -p "archive/$SEASON_EPISODE"
cp pixels.log "archive/$SEASON_EPISODE/"
cp expands.log "archive/$SEASON_EPISODE/"
cp inout.png "archive/$SEASON_EPISODE/"
