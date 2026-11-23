const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

function load(name, fetch) {
    const source = fs.readFileSync(path.resolve(__dirname, '../../apps/admin/src/components/Tools/components/Expand', name + '.ts'), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    new Function('require', 'exports', 'module', 'fetch', compiled)(() => ({ APIhost: 'http://admin.test' }), module.exports, module, fetch);
    return module.exports;
}
const current = { width: 100, height: 80, shiftX: 10, shiftY: -20, colorScheme: 'COLORS_1' };

test('expansion anchors preserve the chosen corner and the existing world coordinates', () => {
    const { createResizePlan } = load('model');
    for (const [corner, shiftX, shiftY, left, top] of [
        ['LT', 10, -20, 0, 0], ['RT', 50, -20, 40, 0],
        ['LB', 10, 20, 0, 40], ['RB', 50, 20, 40, 40],
    ]) {
        const plan = createResizePlan(current, 140, 120, corner, 'COLORS_32');
        assert.deepEqual(plan.next, { width: 140, height: 120, shiftX, shiftY, colorScheme: 'COLORS_32' });
        assert.deepEqual(plan.growth, { left, top, right: 40 - left, bottom: 40 - top });
        assert.equal(plan.addedPixels, 8800);
        assert.equal(plan.changed, true);
    }
});
test('unchanged numeric sizes and a corner-only change do not produce a saveable plan', () => {
    const { createResizePlan } = load('model');
    for (const corner of ['LT', 'RT', 'LB', 'RB']) {
        assert.equal(createResizePlan(current, 100, 80, corner, current.colorScheme).changed, false);
    }
    assert.equal(createResizePlan(current, 100, 80, 'LT', 'truecolor').changed, true);
});
test('dimensions must be positive safe integers and must not shrink the current canvas', () => {
    const { dimensionError } = load('model');
    for (const value of ['', ' ', '0', '-1', '120.5', 'abc', 'Infinity', '9007199254740992']) assert.ok(dimensionError(value, 100), value);
    assert.match(dimensionError('99', 100), /уменьш/i);
    for (const value of ['100', '0100', '240']) assert.equal(dimensionError(value, 100), '');
});
test('reads legacy numeric strings without rejecting an existing palette name', async () => {
    const api = load('api', async () => Response.json({ ...current, width: '100', height: '80', shiftX: '10', shiftY: '-20', colorScheme: 'legacy_palette' }));
    assert.deepEqual(await api.loadCanvas(), { ...current, colorScheme: 'legacy_palette' });
});
test('an unset pause flag means drawing is enabled', async () => {
    for (const data of [{}, { paused: false }, { paused: true }]) {
        const api = load('api', async () => Response.json(data));
        assert.equal(await api.loadPaused(), data.paused === true);
    }
});
test('rejects malformed settings and responses that do not acknowledge a mutation', async () => {
    for (const data of [{}, null, { ...current, width: -1 }, { ...current, shiftX: 'bad' }]) {
        const api = load('api', async () => Response.json(data));
        await assert.rejects(api.loadCanvas(), /настройки/);
    }
    for (const response of [new Response('fail'), new Response('<html>login</html>'), new Response('ok', {status:500})]) {
        const api = load('api', async () => response);
        await assert.rejects(api.saveCanvas(current), /Сервер/);
    }
    const api = load('api', async () => new Response('fail'));
    await assert.rejects(api.savePaused(true), /Сервер/);
});
test('sends numeric dimensions and the existing PUT/DELETE pause contract', async () => {
    const requests = [];
    const api = load('api', async (url, options) => { requests.push([url, options]); return new Response('ok'); });
    await api.saveCanvas(current);
    await api.savePaused(true);
    await api.savePaused(false);
    assert.equal(requests[0][0], 'http://admin.test/admin/expand');
    assert.deepEqual(JSON.parse(requests[0][1].body), current);
    assert.equal(requests[0][1].method, 'PUT');
    assert.equal(requests[1][0], 'http://admin.test/admin/pause');
    assert.equal(requests[1][1].method, 'PUT');
    assert.equal(requests[2][1].method, 'DELETE');
    assert.ok(requests.every(([, options]) => options.credentials === 'include'));
});
