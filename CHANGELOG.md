# Changelog

## 21.09.2026
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
