# Changelog

## 05.09.2026
- Moved `server/tools` one level up to the repo root `tools/` and fixed all relative import paths.
- Added a husky pre-commit hook that runs `npm run build && npm run render` and aborts the commit on any build/render error.
- Added a mandatory rule to CLAUDE.md requiring a CHANGELOG.md entry for every change.
- Fixed admin activity maps to account for canvas expansion shifts (shiftX/shiftY) and the current canvas size.
- Fixed tools/drawEpisode.js to restore the previous canvas at the shift delta (like the live expand) instead of the full cumulative shift when the board expands.
- Fixed tools/drawEpisode.js collapsing the last frames: the trailing empty line of `expands.log` was parsed as a phantom expansion (its `shiftX/shiftY` become `0`), which reset the current shift back to `(0,0)` and redrew all content up-left, leaving the bottom-right of the board empty/white. Empty expands lines are now filtered out.
