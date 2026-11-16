const path = require('node:path');
const { spawn } = require('node:child_process');
const { createDevProxy } = require('./dev-proxy');
const admin = path.resolve(__dirname, '../apps/admin');
const parcel = spawn(process.execPath, [require.resolve('parcel/lib/bin.js'), 'pages/qq/index.html', 'pages/login/index.html', 'pages/logout/index.html', 'pages/404.html', '--port', '1235', '--public-url', '/__admin/', '--no-autoinstall', '--cache-dir', path.join(admin, '.parcel-cache')], { cwd: admin, stdio: 'inherit' });
const proxy = createDevProxy();
let stopping = false;
function stop(signal, code) {
    if (stopping) return;
    stopping = true;
    parcel.kill(signal);
    proxy.close(() => process.exit(code));
    setTimeout(() => process.exit(code), 2000).unref();
}
parcel.on('error', error => { console.error(error); stop('SIGTERM', 1); });
parcel.on('exit', code => stop('SIGTERM', code ?? 1));
proxy.on('error', error => { console.error(error); stop('SIGTERM', 1); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(signal, 0));
proxy.listen(1234, '127.0.0.1', () => console.log('Site: http://localhost:1234/'));
