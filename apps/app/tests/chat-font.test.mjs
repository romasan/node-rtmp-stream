import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChatFontLoader } from '../web/chat-font.mjs';

test('loads and registers the chat font once for concurrent and later openings', async () => {
    let requests = 0;
    const installed = [];
    const load = createChatFontLoader(async () => {
        requests++;
        return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2]).buffer };
    }, bytes => installed.push([...bytes]));
    await Promise.all([load(), load()]);
    await load();
    assert.equal(requests, 1);
    assert.deepEqual(installed, [[1, 2]]);
});

test('retries a failed font request on the next opening', async () => {
    let requests = 0;
    const load = createChatFontLoader(async () => {
        requests++;
        return requests === 1 ? { ok: false, status: 503 } : { ok: true, arrayBuffer: async () => new ArrayBuffer(1) };
    }, () => {});
    await assert.rejects(load());
    await load();
    assert.equal(requests, 2);
});
