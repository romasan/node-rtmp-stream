# Changelog

## 05.09.2026
- Moved `server/tools` one level up to the repo root `tools/` and fixed all relative import paths.
- Added a husky pre-commit hook that runs `npm run build && npm run render` and aborts the commit on any build/render error.
- Added a mandatory rule to CLAUDE.md requiring a CHANGELOG.md entry for every change.
- Fixed admin activity maps to account for canvas expansion shifts (shiftX/shiftY) and the current canvas size.
