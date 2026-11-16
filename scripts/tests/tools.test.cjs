const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const getDirectoriesRecursive = require('../../tools/getDirectoriesRecursive');
test('directory tool traverses a nested tree', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-tools-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.mkdirSync(path.join(root, 'nested'));
    fs.writeFileSync(path.join(root, 'nested', 'file'), '');
    getDirectoriesRecursive(root);
});
