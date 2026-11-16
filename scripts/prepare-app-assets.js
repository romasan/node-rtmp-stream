const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { colorSchemes } = require('../tools/loadColorSchemes');
const constants = require('../apps/admin/src/constants.json');
const output = path.join(root, 'apps/app/generated');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'palette.json'), JSON.stringify({ ...constants, colorSchemes }));
