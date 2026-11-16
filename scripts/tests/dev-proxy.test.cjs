const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { WebSocket, WebSocketServer } = require('ws');
const { createDevProxy } = require('../dev-proxy');
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));

test('forwards API requests and WebSocket upgrades to the backend', async t => {
    const backend = http.createServer((req, res) => res.end(req.url === '/ip' ? req.headers['x-forwarded-for'] : req.url));
    const wsServer = new WebSocketServer({ server: backend });
    wsServer.on('connection', (ws, request) => ws.send(JSON.stringify({ url: request.url, ip: request.headers['x-forwarded-for'] })));
    const port = await listen(backend);
    const proxy = createDevProxy({ frontendPort: port, backendPort: port });
    const proxyPort = await listen(proxy);
    t.after(() => { wsServer.close(); proxy.close(); backend.close(); });
    const response = await fetch(`http://127.0.0.1:${proxyPort}/__api/start?x=1`);
    assert.equal(await response.text(), '/start?x=1');
    const address = await fetch(`http://127.0.0.1:${proxyPort}/__api/ip`);
    assert.equal(await address.text(), '127.0.0.1');
    const message = await new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${proxyPort}/__ws`);
        ws.on('message', data => { resolve(data.toString()); ws.close(); });
        ws.on('error', reject);
    });
    assert.deepEqual(JSON.parse(message), { url: '/', ip: '127.0.0.1' });
});

test('routes the game, admin pages and their assets through one origin', async t => {
    const game = http.createServer((req, res) => res.end(`game:${req.url}`));
    const admin = http.createServer((req, res) => res.end(`admin:${req.url}`));
    const gamePort = await listen(game);
    const adminPort = await listen(admin);
    const proxy = createDevProxy({ frontendPort: adminPort, appPort: gamePort });
    const port = await listen(proxy);
    t.after(() => { proxy.close(); game.close(); admin.close(); });
    for (const [url, expected] of [
        ['/', 'game:/'], ['/timelapse/?season=1', 'game:/timelapse/?season=1'],
        ['/bridge.js', 'game:/bridge.js'], ['/qq/', 'admin:/qq/'],
        ['/login/?local', 'admin:/login/?local'], ['/logout/', 'admin:/logout/'],
        ['/__admin/qq/app.js', 'admin:/__admin/qq/app.js'],
    ]) {
        const response = await fetch(`http://127.0.0.1:${port}${url}`);
        assert.equal(await response.text(), expected, url);
    }
});

test('routes Parcel and Trunk reload sockets to their own dev servers', async t => {
    const game = http.createServer();
    const admin = http.createServer();
    const gameWs = new WebSocketServer({ server: game });
    const adminWs = new WebSocketServer({ server: admin });
    gameWs.on('connection', ws => ws.send('trunk'));
    adminWs.on('connection', ws => ws.send('parcel'));
    const gamePort = await listen(game);
    const adminPort = await listen(admin);
    const proxy = createDevProxy({ frontendPort: adminPort, appPort: gamePort });
    const port = await listen(proxy);
    t.after(() => { gameWs.close(); adminWs.close(); proxy.close(); game.close(); admin.close(); });
    for (const [url, expected] of [['/', 'parcel'], ['/.well-known/trunk/ws', 'trunk']]) {
        const result = await new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://127.0.0.1:${port}${url}`);
            ws.on('message', data => { resolve(data.toString()); ws.close(); });
            ws.on('error', reject);
        });
        assert.equal(result, expected);
    }
});
