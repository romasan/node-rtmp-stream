const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { year, episode } = require('../../shared/constants.json');
const { assemble } = require('../assemble-site');
test('publishes Slint routes, admin, and assets for a separate Telegram host', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-site-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (name, text) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  put('app/index.html', '<html><head><title>PIXEL BATTLE · Пиксель Батл %Y_S_E%</title><base href="/"><meta name="site-base" content=""></head><body><script src="/app.js"></script>wasm</body></html>');
  put('app/app.js', 'js');
  put('app/snippets/example.js', 'snippet');
  put('app/tg/index.html', 'standalone route');
  put('app/app.wasm', 'wasm');
  put('admin/qq/index.html', 'admin');
  for (const route of ['', 'tg/', 'timelapse/']) put(`meta/${route}index.html`, '<title>Pixel</title><meta name="description" content="game">');
  put('static/sitemap.xml', 'DATETIME');
  fs.mkdirSync(path.join(root, 'assets'));
  assemble({ app: path.join(root, 'app'), admin: path.join(root, 'admin'), meta: path.join(root, 'meta'), assets: path.join(root, 'assets'), staticDir: path.join(root, 'static'), output: path.join(root, 'output') });
  for (const route of ['', 'tg/', 'timelapse/']) {
    const html = fs.readFileSync(path.join(root, `output/${route}index.html`), 'utf8');
    assert.match(html, /wasm/); assert.match(html, /description/);
    assert.ok(html.includes(`<title>PIXEL BATTLE · Пиксель Батл ${year} ${episode}</title>`));
    assert.equal((html.match(/<title>/g) || []).length, 1);
  }
  assert.equal(fs.readFileSync(path.join(root, 'output/qq/index.html'), 'utf8'), 'admin');
  const html = fs.readFileSync(path.join(root, 'output/index.html'), 'utf8');
  const match = html.match(/src="(\/app\/[^/]+\/app\.js)"/);
  assert.ok(match, 'application assets use a content-versioned path');
  const assetDir = path.dirname(match[1]);
  assert.ok(html.includes(`<base href="${assetDir}/">`));
  assert.ok(html.includes('<meta name="site-base" content="/">'));
  assert.equal(fs.readFileSync(path.join(root, 'output', assetDir, 'app.wasm'), 'utf8'), 'wasm');
  assert.equal(fs.readFileSync(path.join(root, 'output/tg', assetDir, 'app.wasm'), 'utf8'), 'wasm');
  assert.equal(fs.readFileSync(path.join(root, 'output', assetDir, 'snippets/example.js'), 'utf8'), 'snippet');
});
