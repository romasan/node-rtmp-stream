const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const script = path.resolve(__dirname, '../../tools/analyzePixels.js');

test('reports rapid and regular activity and shared addresses without treating malformed lines as pixels', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixels-analysis-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'pixels.log');
    const lines = [];
    for (let i = 11; i >= 0; i--) lines.push(`${10000 + i * 500};twitch;${i};0;#ffffff;user-a;1.2.3.4;alice`);
    lines.push('20000;discord;2;3;#000000;user-b;1.2.3.4;bob', 'broken', ';;1;2;#ffffff;user-c;ip;nick');
    fs.writeFileSync(file, lines.join('\n'));
    const result = spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.summary.validLines, 13);
    assert.equal(report.summary.invalidLines, 2);
    const account = report.accounts.find(item => item.uuid === 'user-a');
    assert.equal(account.rapid.count, 11);
    assert.equal(account.regularity.medianIntervalMs, 500);
    assert.equal(account.regularity.matchingIntervals, 11);
    assert.equal(report.sharedIps[0].accountCount, 2);
});

test('rejects a missing input file', () => {
    const result = spawnSync(process.execPath, [script, '/nonexistent/pixels.log'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /nonexistent/);
});

test('detects a raster with irregular timing and splits straight runs at a pause', async t => {
    const analyze = require(script);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-paths-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'pixels.log');
    const lines = [];
    let time = 10000;
    const add = (x, y, uuid, pause = 0) => {
        time += [1500, 3200, 5500][lines.length % 3] + pause;
        lines.push(`${time};twitch;${x};${y};#ffffff;${uuid};;`);
    };
    for (let y = -3; y < 0; y++) {
        for (let x = 0; x < 8; x++) add(y % 2 ? x - 8 : -1 - x, y, 'scanner');
    }
    for (let x = 0; x < 20; x++) add(x, 0, 'straight');
    for (let x = 0; x < 20; x++) add(x, 0, 'paused', x === 10 ? 60000 : 0);
    fs.writeFileSync(file, lines.reverse().join('\n'));

    const report = await analyze(file);
    const scanner = report.accounts.find(account => account.uuid === 'scanner');
    assert.deepEqual(scanner.signals, ['raster_scan']);
    assert.equal(scanner.spatial.rasterScan.rows, 3);
    assert.equal(scanner.spatial.rasterScan.pixels, 24);
    assert.deepEqual(scanner.spatial.rasterScan.bounds, { minX: -8, maxX: -1, minY: -3, maxY: -1 });
    const straight = report.accounts.find(account => account.uuid === 'straight');
    assert.deepEqual(straight.signals, ['straight_run']);
    assert.equal(straight.spatial.straightRun.pixels, 20);
    assert.ok(!report.accounts.some(account => account.uuid === 'paused'));
});

test('finds a line drawn by alternating accounts on different IPs despite unrelated intervening pixels', async t => {
    const analyze = require(script);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-groups-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'pixels.log');
    const lines = [];
    for (let i = 0; i < 24; i++) {
        const account = i % 3;
        lines.push(`${i * 1200};twitch;${i};-1;#ffffff;user-${account};1.2.3.${account + 1};nick-${account}`);
        lines.push(`${i * 1200 + 100};discord;${i};99;#000000;other;;`);
        lines.push(`${i * 1200 + 200};discord;${i};50;#000000;handoff-${Math.floor(i / 12)};;`);
    }
    fs.writeFileSync(file, lines.join('\n'));
    const report = await analyze(file);
    const [group] = report.coordinatedPaths;
    assert.equal(report.coordinatedPaths.length, 1);
    assert.equal(group.pixels, 24);
    assert.equal(group.accountSwitches, 23);
    assert.deepEqual(group.placements.slice(0, 3).map(entry => entry.line), [1, 4, 7]);
    assert.deepEqual(group.accounts.map(account => [account.uuid, account.pixels]), [
        ['user-0', 8], ['user-1', 8], ['user-2', 8],
    ]);
});

test('clusters recurring synchronous pairs across IPs and filters isolated and control-level matches', async t => {
    const analyze = require(script);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-graph-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'pixels.log');
    const lines = [];
    const add = (time, x, account, ip) => lines.push(`${time};twitch;${x};-1;#ffffff;${account};${ip};${account}`);
    for (let i = 0; i < 30; i++) {
        const time = 1000 + Math.floor(i / 10) * 60000 + (i % 10) * 2000;
        const x = i * 10;
        add(time, x, 'a', '1.2.3.4');
        add(time + 300, x + 2, 'b', '2.3.4.5');
        add(time + 600, x + 4, 'c', '3.4.5.6');
        add(time, x + 1000, 'd', '');
        add(time + 300, x + 1001, 'e', '');
        add(time + 10000, x + 1001, 'e', '');
        if (i < 10) {
            add(time, x + 2000, 'f', '');
            add(time + 200, x + 2001, 'g', '');
        }
    }
    fs.writeFileSync(file, lines.reverse().join('\n'));
    const { synchronization } = await analyze(file);
    assert.deepEqual(synchronization.edges.map(edge => edge.uuids), [['a', 'b'], ['b', 'c']]);
    assert.equal(synchronization.edges[0].matches, 30);
    assert.equal(synchronization.edges[0].activeWindows, 3);
    assert.deepEqual(synchronization.clusters[0].uuids, ['a', 'b', 'c']);
    assert.equal(synchronization.clusters[0].density, 2 / 3);
});
