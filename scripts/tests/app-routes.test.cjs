const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRoutes } = require('../prepare-app-routes');
test('standalone app build serves game, Telegram, and timelapse routes', t => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-app-'));
    t.after(() => fs.rmSync(output, { recursive: true, force: true }));
    fs.writeFileSync(path.join(output, 'index.html'), '<base href="/prefix/">game');
    createRoutes(output);
    for (const route of ['tg', 'timelapse']) {
        assert.equal(fs.readFileSync(path.join(output, route, 'index.html'), 'utf8'), '<base href="/prefix/">game');
    }
});
