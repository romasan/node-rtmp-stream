# Changelog

## 20.09.2026
- Updated vulnerable direct dependencies: `ws` `^8.13.0` → `^8.21.3` and `form-data` `^4.0.0` → `^4.0.6`.
- Removed dead unused dependencies: `parcel-bundler`, `res` and `src` (they pulled hundreds of packages and vulnerable `underscore`/`uuid`). `package-lock.json` shrank from 1767 to 1016 packages, `yarn.lock` was regenerated accordingly.
- Aligned Parcel packages to a single version (`parcel`, `@parcel/transformer-sass`, `@parcel/transformer-svg-react`: `^2.10.3` → `^2.16.4`) — Parcel requires plugin versions to match exactly.
- Applied `npm audit fix` where no breaking changes were required.
- Declared `svgo` (`3.3.5`) as an explicit pinned devDependency: `@parcel/transformer-svg-react` (see `.parcelrc`) needs it, and without it Parcel runs `npm install --json --save-dev svgo@^3` during every build, rewriting `package.json` and both lock files and requiring network access.
- Constrained `sass` to `^1.70.0 <1.100.0` (resolves to `1.99.0`): `sass@1.100.0` and newer declare `engines.node >=20.19.0`, which broke `yarn install` on the supported Node 18.
- Added `npm audit` CI job (`.github/workflows/security.yml`) and Dependabot config (`.github/dependabot.yml`) to prevent the vulnerability backlog from growing again.

## 05.09.2026
- Moved `server/tools` one level up to the repo root `tools/` and fixed all relative import paths.
- Added a husky pre-commit hook that runs `npm run build && npm run render` and aborts the commit on any build/render error.
- Added a mandatory rule to CLAUDE.md requiring a CHANGELOG.md entry for every change.
- Fixed admin activity maps to account for canvas expansion shifts (shiftX/shiftY) and the current canvas size.
- Fixed tools/drawEpisode.js to restore the previous canvas at the shift delta (like the live expand) instead of the full cumulative shift when the board expands.
- Fixed tools/drawEpisode.js collapsing the last frames: the trailing empty line of `expands.log` was parsed as a phantom expansion (its `shiftX/shiftY` become `0`), which reset the current shift back to `(0,0)` and redrew all content up-left, leaving the bottom-right of the board empty/white. Empty expands lines are now filtered out.
