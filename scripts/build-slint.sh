#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
client=client-rust
output="${1:-dist/slint}"
if ! command -v wasm-pack >/dev/null 2>&1; then
    version="$(awk '$0 == "name = \"wasm-bindgen\"" { getline; gsub(/"/, "", $3); print $3; exit }' "$client/Cargo.lock")"
    tools="$client/target/tools"
    if [ -x "$tools/bin/wasm-bindgen" ]; then
        wasm_bindgen="$tools/bin/wasm-bindgen"
    else
        wasm_bindgen="$(command -v wasm-bindgen || true)"
    fi
    if [ -z "$wasm_bindgen" ] || [ "$("$wasm_bindgen" --version)" != "wasm-bindgen $version" ]; then
        printf '%s\n' "Slint requires wasm-pack or wasm-bindgen $version." \
            "Install the matching CLI from the project root:" \
            "  cargo +1.93.0 install wasm-bindgen-cli --version $version --locked --root $tools" >&2
        exit 1
    fi
fi

mkdir -p "$output" "$output/timelapse" "$output/tg"
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT
pkg="$staging/pkg"
mkdir "$pkg"

if command -v wasm-pack >/dev/null 2>&1; then
    (cd "$client" && wasm-pack build --release --target web --out-dir "$pkg" --no-pack --locked)
else
    (cd "$client" && cargo build --locked --release --target wasm32-unknown-unknown)
    "$wasm_bindgen" --target web --remove-name-section --out-dir "$pkg" \
        "$client/target/wasm32-unknown-unknown/release/pixelbattle_slint.wasm"
fi

# Keep the wasm-pack and wasm-bindgen builds consistent. The optional WASM
# name section contains Rust symbols and is unnecessary to run the client.
node - "$pkg/pixelbattle_slint_bg.wasm" <<'JS'
const fs = require('node:fs');
const file = process.argv[2];
const wasm = fs.readFileSync(file);
let offset = 8;
const sections = [wasm.subarray(0, offset)];
function readLength() {
    let value = 0;
    for (let shift = 0; shift <= 28; shift += 7) {
        if (offset >= wasm.length) break;
        const byte = wasm[offset++];
        value += (byte & 0x7f) * 2 ** shift;
        if (byte < 0x80) return value;
    }
    throw new Error('Malformed WebAssembly section size');
}
while (offset < wasm.length) {
    const start = offset;
    const kind = wasm[offset++];
    const length = readLength();
    const end = offset + length;
    if (end > wasm.length) throw new Error('Truncated WebAssembly section');
    let name;
    if (kind === 0) {
        const nameLength = readLength();
        if (offset + nameLength > end) throw new Error('Invalid WebAssembly section name');
        name = wasm.subarray(offset, offset + nameLength).toString();
    }
    if (name !== 'name') sections.push(wasm.subarray(start, end));
    offset = end;
}
fs.writeFileSync(file, Buffer.concat(sections));
JS

cp "$client/web/bridge.js" "$client/web/timelapse.js" "$pkg/"
cp assets/eye-dropper.png "$pkg/"
node -e 'const { colorSchemes } = require("./tools/loadColorSchemes"); process.stdout.write(JSON.stringify({ ...require("./src/constants.json"), colorSchemes }));' > "$pkg/palette.json"
version="$(node - "$pkg" <<'JS'
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const directory = process.argv[2];
const hash = createHash('sha256');
for (const name of ['bridge.js', 'timelapse.js', 'palette.json', 'pixelbattle_slint.js', 'pixelbattle_slint_bg.wasm', 'eye-dropper.png']) {
    hash.update(readFileSync(directory + '/' + name));
}
process.stdout.write(hash.digest('hex').slice(0, 16));
JS
)"
mkdir -p "$output/pkg/$version"
cp -R "$pkg/." "$output/pkg/$version/"
entry() {
    depth="$1"
    kind="$2"
    fallback="$3"
    sed -e "s#\./pkg/#${depth}pkg/$version/#g" \
        -e "s#data-client=\"game\"#data-client=\"$kind\"#" \
        -e "s#<a href=\"/\"#<a href=\"$fallback\"#" "$client/web/index.html"
}
entry ./ game / > "$output/index.html"
entry ../ timelapse /timelapse/ > "$output/timelapse/index.html"
entry ../ telegram /tg/ > "$output/tg/index.html"
