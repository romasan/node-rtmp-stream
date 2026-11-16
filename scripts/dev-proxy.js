const http = require('node:http');
const net = require('node:net');

function createDevProxy({ frontendPort = 1235, appPort = 1420, backendPort = 8080 } = {}) {
    const isAdminPath = url => /^\/(?:qq|login|logout|__admin)(?:\/|\?|$)/.test(url);
    const server = http.createServer((req, res) => {
        const isApi = req.url === '/__api' || req.url.startsWith('/__api/');
        const upstream = http.request({ hostname: '127.0.0.1', port: isApi ? backendPort : isAdminPath(req.url) ? frontendPort : appPort,
            method: req.method, path: isApi ? req.url.replace(/^\/__api/, '') || '/' : req.url,
            headers: { ...req.headers, 'x-forwarded-for': req.socket.remoteAddress || '127.0.0.1' } }, response => {
            res.writeHead(response.statusCode, response.headers);
            response.pipe(res);
        });
        upstream.on('error', error => { if (!res.headersSent) res.writeHead(502); res.end(error.message); });
        req.pipe(upstream);
    });
    server.on('upgrade', (req, socket, head) => {
        const isWs = req.url === '/__ws' || req.url.startsWith('/__ws?');
        // Parcel's HMR socket uses the root path; Trunk uses /.well-known/trunk/ws.
        const isAdminSocket = req.url === '/' || isAdminPath(req.url);
        const upstream = net.connect(isWs ? backendPort : isAdminSocket ? frontendPort : appPort, '127.0.0.1', () => {
            const url = isWs ? req.url.replace(/^\/__ws/, '/') : req.url;
            const headers = [];
            for (let i = 0; i < req.rawHeaders.length; i += 2) {
                if (req.rawHeaders[i].toLowerCase() !== 'x-forwarded-for') headers.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
            }
            headers.push(`X-Forwarded-For: ${req.socket.remoteAddress || '127.0.0.1'}`);
            upstream.write(`${req.method} ${url} HTTP/${req.httpVersion}\r\n${headers.join('\r\n')}\r\n\r\n`);
            if (head.length) upstream.write(head);
            upstream.pipe(socket).pipe(upstream);
        });
        upstream.on('error', () => socket.destroy());
        socket.on('error', () => upstream.destroy());
    });
    return server;
}
module.exports = { createDevProxy };
