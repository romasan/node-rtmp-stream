const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const filename = require.resolve('../../apps/admin/src/components/Tools/components/Bans/api.ts');
function loadApi(fetch) {
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    new Function('require', 'exports', 'module', 'fetch', compiled)(() => ({ APIhost: 'http://admin.test' }), module.exports, module, fetch);
    return module.exports;
}
const empty = () => ({ token: {}, ip: {}, nick: {}, mute: {} });

test('loads all ban categories and preserves permanent and timed records', async () => {
    const bans = { ...empty(), token: { session: 1900000000000 }, ip: { '192.0.2.1': true } };
    const api = loadApi(async (url, options) => {
        assert.equal(url, 'http://admin.test/admin/getBans');
        assert.equal(options.credentials, 'include');
        return Response.json(bans);
    });
    assert.deepEqual(await api.loadBans(), bans);
});
test('rejects expired authentication instead of displaying an empty list', async () => {
    const api = loadApi(async () => new Response('unauthorized', { status: 401 }));
    await assert.rejects(api.loadBans(), /Войдите снова/);
});
test('rejects malformed ban data rather than treating it as a valid empty result', async () => {
    for (const data of [{}, null, { ...empty(), ip: [] }, { ...empty(), nick: { broken: 'forever' } }]) {
        const api = loadApi(async () => Response.json(data));
        await assert.rejects(api.loadBans(), /список/);
    }
});
test('adding requires both a successful HTTP response and an explicit server acknowledgement', async () => {
    for (const response of [new Response('ok', { status: 500 }), new Response('fail'), new Response('<html>Login</html>')]) {
        const api = loadApi(async () => response);
        await assert.rejects(api.addBan('nick', 'Player'), /Сервер не подтвердил/);
    }
});
test('sends ban and unban requests using the existing API contract', async () => {
    const requests = [];
    const api = loadApi(async (url, options) => {
        requests.push([url, options]);
        return new Response('ok');
    });
    await api.addBan('ip', '192.0.2.1\n2001:db8::1');
    await api.removeBan('mute', 'Player');
    assert.equal(requests[0][0], 'http://admin.test/admin/ban');
    assert.equal(requests[0][1].method, 'PUT');
    assert.deepEqual(JSON.parse(requests[0][1].body), { type: 'ip', value: '192.0.2.1\n2001:db8::1' });
    assert.equal(requests[1][0], 'http://admin.test/admin/unban');
    assert.equal(requests[1][1].method, 'PATCH');
    assert.deepEqual(JSON.parse(requests[1][1].body), { type: 'mute', value: 'Player' });
    assert.equal(requests[1][1].credentials, 'include');
});
test('ignores legacy false entries that the server does not treat as active bans', async () => {
    const api = loadApi(async () => Response.json({
        token: { disabledSession: false },
        ip: { '192.0.2.1': true, '192.0.2.2': false },
        nick: { ActivePlayer: true, ClearedPlayer: false },
        mute: { DisabledMute: false },
    }));
    assert.deepEqual(await api.loadBans(), {
        token: {}, ip: { '192.0.2.1': true }, nick: { ActivePlayer: true }, mute: {},
    });
});
