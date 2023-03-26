const WebSocket = require('ws')
const fs = require('fs');
const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { canvas, drawPix } = require('./canvas');
const ee = require('./ee');

const { WS_SERVER_PORT, WS_SECURE } = process.env;

const CHARS = new Array(26).fill().map((_, i) => String.fromCharCode(97 + i) + String.fromCharCode(65 + i)).join('') + new Array(10).fill().map((_, i)=>String(i)).join('');
const getId = (length = 11) => new Array(length).fill().map(() => CHARS[Math.floor(Math.random()*CHARS.length)]).join('');

let webServer = null;

const webServerHandler = (req, res) => {
	if (req.url === '/canvas.png') {
		res.writeHead(200, {'Content-Type': 'image/png'});
		res.end(canvas.toBuffer());
		return;
	}
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('=)');
	res.end();
}

const handleMessage = ({ user, event, payload }) => {
	if (event === 'pushPix' /* && user.authorized */) {
		drawPix({
			...payload,
			nickname: user.nickname,
		});
	}
}

if (WS_SECURE === 'true') {
	const privateKey = fs.readFileSync('ssl-cert/privkey.pem', 'utf8');
	const certificate = fs.readFileSync('ssl-cert/fullchain.pem', 'utf8');
	const credentials = { key: privateKey, cert: certificate };
	webServer = https.createServer(credentials, webServerHandler);
} else {
	webServer = http.createServer(webServerHandler);
}
webServer.listen(WS_SERVER_PORT);

const wss = new WebSocket.Server({ server: webServer });

const send = (ws, data) => {
	ws.send(JSON.stringify(data))
};

const spam = (data) => {
	const message = JSON.stringify(data);
	wss.clients.forEach(ws => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
};

ee.on('spam', spam);

wss.on('connection', ws => {
	const user = {
		authorized: false,
		nickname: null,
	};

	ws.on('message', (buf) => {
		const raw = buf.toString()
		if (raw === '2') {
			ws.send(3);
			return;
		}
		try {
			const { event, payload } = JSON.parse(raw);
			if (event) {
				handleMessage({ event, payload, user });
			}
		} catch (e) {
			console.log('Error: parse json', e)
		}
	});

	ws.on('close', () => {
		// console.log(`disconnected: client #${id} ${new Date()}`);
	})
});

module.exports = {
	spam,
}
