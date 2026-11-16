import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';

// Load the browser entry as an ES module without changing the package type.
const source = await readFile(new URL('../web/timelapse.js', import.meta.url));
const { createReplay } = await import(`data:text/javascript;base64,${source.toString('base64')}`);

function fixture(t) {
    const partSize = 500;
    const requests = [];
    const updates = [];
    const snapshots = [];
    const states = [];
    const frames = new Map();
    let frameId = 0;
    let part;
    let corruptPrefetch = false;
    let holdPrefetch = false;

    const browser = {
        location: { hash: '#staticHost=https://archives.example' },
        requestAnimationFrame(callback) {
            frames.set(++frameId, callback);
            return frameId;
        },
        cancelAnimationFrame(id) { frames.delete(id); },
    };
    for (const [name, value] of Object.entries(browser)) {
        const original = Object.getOwnPropertyDescriptor(globalThis, name);
        Object.defineProperty(globalThis, name, { value, configurable: true });
        t.after(() => {
            if (original) Object.defineProperty(globalThis, name, original);
            else delete globalThis[name];
        });
    }
    t.mock.method(globalThis, 'fetch', async (url, { signal, cache }) => {
        assert.equal(url.origin, 'https://archives.example');
        const path = url.pathname;
        requests.push({ path, cache, signal });
        if (path === '/timelapse/index.json') {
            return Response.json({ seasons: [
                { key: 'older', label: 'Older' },
                { key: 'latest', label: 'Latest' },
            ] });
        }
        if (path.endsWith('/index.json')) return Response.json({ total: 1499 });
        if (path.endsWith('.png')) return new Response(Uint8Array.of(1));
        const nextPart = path === '/timelapse/latest/1.bin';
        if (nextPart && holdPrefetch) {
            return new Promise((_, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            });
        }
        return new Response(gzipSync(Uint8Array.of(nextPart && corruptPrefetch ? 0 : 1)));
    });

    const player = createReplay({
        set_seasons() {},
        replay_selected() {},
        replay_display() {},
        playing() {},
        replay_state(loaded, status, retryable) { states.push({ loaded, status, retryable }); },
        load_archive() { return true; },
        replay_chunk(pixel) {
            const id = Math.floor(pixel / partSize);
            const start = id * partSize;
            return JSON.stringify({
                part: id,
                start,
                end: start + partSize - 1,
                offset: pixel - start,
                section_start: id === 0 ? 0 : partSize,
                can_continue: true,
                previous_pixel: null,
            });
        },
        load_replay_chunk(pixel) {
            part = Math.floor(pixel / partSize);
            snapshots.push(part);
            return true;
        },
        continue_replay(pixel, records) {
            if (records[0] === 0) return false;
            part = Math.floor(pixel / partSize);
            return true;
        },
        advance_replay(count) { updates.push([part, count]); },
    });

    async function tick(time) {
        assert.equal(frames.size, 1);
        const [[id, callback]] = frames;
        frames.delete(id);
        await callback(time);
    }

    return {
        player, requests, updates, snapshots, states, frames, tick,
        corrupt() { corruptPrefetch = true; },
        repair() { corruptPrefetch = false; },
        hold() { holdPrefetch = true; },
    };
}

test('playback uses one PNG across an expansion, while seeking loads the target PNG', async t => {
    const { player, requests, updates, snapshots, tick } = fixture(t);
    await player.open();
    player.toggle();
    await tick(0);
    await tick(100);
    assert.deepEqual(updates.at(-1), [0, 500], 'render the last update before expanding');
    await tick(116);
    assert.deepEqual(updates.at(-1), [1, 1], 'continue with records in the expanded field');
    assert.deepEqual(requests.filter(item => item.path.endsWith('.png')).map(item => item.path), [
        '/timelapse/latest/0.png',
    ]);
    assert.equal(requests.filter(item => item.path.endsWith('/1.bin')).length, 1);

    await player.seek(1);
    assert.equal(requests.filter(item => item.path.endsWith('/2.png')).length, 1);
    assert.deepEqual(snapshots, [0, 2]);
    assert.deepEqual(updates.at(-1), [2, 500]);
});

test('changing seasons aborts a pending prefetch and cancels playback', async t => {
    const { player, requests, snapshots, updates, frames, tick, hold } = fixture(t);
    hold();
    await player.open();
    player.toggle();
    await tick(0);
    const prefetch = requests.find(item => item.path === '/timelapse/latest/1.bin');
    assert.equal(prefetch.signal.aborted, false);

    await player.select(0);
    assert.equal(prefetch.signal.aborted, true);
    assert.equal(frames.size, 0);
    assert.deepEqual(snapshots, [0, 0]);
    assert.deepEqual(updates.at(-1), [0, 0]);
    assert(requests.some(item => item.path === '/timelapse/older/0.png'));
});

test('retry after a corrupt prefetch reloads the records and preserves the last good frame', async t => {
    const { player, requests, updates, states, frames, tick, corrupt, repair } = fixture(t);
    const failure = t.mock.method(console, 'error', () => {});
    corrupt();
    await player.open();
    player.toggle();
    await tick(0);
    await tick(100);
    await tick(116);
    assert.equal(frames.size, 0);
    assert.deepEqual(updates.at(-1), [0, 500]);
    assert.equal(failure.mock.callCount(), 1);

    repair();
    player.toggle();
    await tick(200);
    await tick(216);
    assert.deepEqual(updates.at(-1), [1, 1]);
    assert.deepEqual(states.at(-1), { loaded: true, status: '', retryable: false });
    assert.deepEqual(requests.filter(item => item.path.endsWith('/1.bin')).map(item => item.cache), [
        'default', 'reload',
    ]);
    assert(!requests.some(item => item.path.endsWith('/1.png')));
});
