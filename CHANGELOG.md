# Changelog

## 21.09.2026
- Updated dependencies to close the Dependabot alerts: `ws ^8.21.3`, `form-data ^4.0.6`, `canvas ^3.2.3`, `parcel ^2.16.4`, `node-fetch ^2.7.0`, `pm2 ^7.0.4` (#72).
- Pinned patched versions of transitive dependencies via npm `overrides`, cutting `npm audit` from 140 findings (13 critical, 58 high) to 5 high and 0 critical (#72).
- Removed unused dependencies (`parcel-bundler`, `res`, `src`, `parcel-plugin-static-files-copy`, PostCSS plugins), which dropped the legacy Parcel 1 tree with its vulnerable transitive packages.
- Kept `uuid` on 9.x and documented why: `uuid@10+` ships ES2021 syntax (`??`, `?.`) that react-snap's Chromium 78 cannot parse, so the client bundle never boots and the prerender fails silently.
- Added an `npm audit` gate to the deploy workflow (`--omit=dev --audit-level=high` plus `--audit-level=critical`) with a weekly schedule and manual trigger (#72).
- Documented the inapplicable moderate `uuid` advisory (GHSA-w5hq-g745-h8pq affects v3/v5/v6 with an external `buf`; the project uses v4 only) that keeps the production audit gate at `high`.
- Added a `smoke:server` script that checks a running server end to end: guest session, WebSocket `init`, ping/pong and chat history (#72).
- Refactored `tools/drawEpisode.js` to render episode frames in parallel via `child_process.fork` (`DRAW_EPISODE_WORKERS` sets the worker count), byte-identical to serial output.
- Fixed `tools/drawEpisode.js` keeping residue of the previous frame: the frame canvas is now cleared (`ctx.clearRect`) before each draw, so smaller or transparent backgrounds no longer show stale pixels.

## 20.09.2026
- Fixed `tools/drawEpisode.js` failing with `ENOENT` when the output `frames/` directory does not exist: the directory is now created automatically before rendering.
- Fixed `tools/drawEpisode.js` crashing with `EISDIR` when the background directory (e.g. `./tmp`) contains subdirectories: only image files (`.jpg`/`.jpeg`/`.png`/`.webp`) are now used as background frames.
- Added a debug overlay to `tools/drawEpisode.js` (enabled via the `debugInfo` flag) that draws frame number, last rendered pixel, expansion number, canvas size and expansion shift in the top-left corner of every frame.
- Fixed `tools/prepareTimelapse.js` expanding the canvas: the previously rendered image (and the emitted `expand.shift`) now uses the shift delta between consecutive expansions instead of the cumulative shift, so the image is no longer offset twice on multi-axis expansions.
- Added `scripts/packTimelapse.sh`, which copies archived episode timelapses into `tmp/timelapse/<season>/` and generates `tmp/timelapse/index.json` with the season list.
- Added `tools/loadColorSchemes.js`, which loads the color schemes from `server/constants/colorSchemes.ts` via `ts-node`, so `tools/prepareTimelapse.js` and `tools/drawEpisode.js` work on Node 18 as well as Node 24+ instead of relying on the experimental `require('.ts')`.
- Pinned `nan` to `^2.29.0` for `canvas` via npm `overrides` so the native module compiles on Node 24 (canvas 2.11.2 requires a newer `nan`).

## 05.09.2026
- Moved `server/tools` one level up to the repo root `tools/` and fixed all relative import paths.
- Added a husky pre-commit hook that runs `npm run build && npm run render` and aborts the commit on any build/render error.
- Added a mandatory rule to CLAUDE.md requiring a CHANGELOG.md entry for every change.
- Fixed admin activity maps to account for canvas expansion shifts (shiftX/shiftY) and the current canvas size.
- Fixed tools/drawEpisode.js to restore the previous canvas at the shift delta (like the live expand) instead of the full cumulative shift when the board expands.
- Fixed tools/drawEpisode.js collapsing the last frames: the trailing empty line of `expands.log` was parsed as a phantom expansion (its `shiftX/shiftY` become `0`), which reset the current shift back to `(0,0)` and redrew all content up-left, leaving the bottom-right of the board empty/white. Empty expands lines are now filtered out.
