#!/bin/bash

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
ARCHIVE_DIR="$SCRIPT_DIR/../db/archive"
TMP_DIR="$SCRIPT_DIR/../tmp/timelapse"
INDEX_FILE="$TMP_DIR/index.json"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

seasons=()

for season_dir in "$ARCHIVE_DIR"/*/; do
    season="$(basename "$season_dir")"
    timelapse_dir="$season_dir/timelapse"

    # Пропускаем сезоны без подготовленного таймлапса
    if ! ls "$timelapse_dir"/*.bin >/dev/null 2>&1; then
        continue
    fi

    echo "Copying $season..."

    mkdir -p "$TMP_DIR/$season"
    cp -R "$timelapse_dir/." "$TMP_DIR/$season/"

    seasons+=("$season")
done

# Формируем список сезонов tmp/timelapse/index.json
{
    printf '{\n'
    printf '\t"seasons": [\n'

    last=$((${#seasons[@]} - 1))

    for i in "${!seasons[@]}"; do
        season="${seasons[$i]}"
        label="$(echo "$season" | tr '[:lower:]' '[:upper:]')"

        printf '\t\t{\n'
        printf '\t\t\t"key": "%s",\n' "$season"
        printf '\t\t\t"label": "%s"\n' "$label"

        if [ "$i" -lt "$last" ]; then
            printf '\t\t},\n'
        else
            printf '\t\t}\n'
        fi
    done

    printf '\t]\n'
    printf '}\n'
} > "$INDEX_FILE"

echo "Done: $INDEX_FILE"
