const WebSocket = require('ws')
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config();
const ee = require('./lib/ee');
const web = require('./web');
const {
	getPathByToken,
} = require('./web/helpers');
const { COLORS, CHAT_WINDOW_LOCATION } = require('./const');
const parseCookies = require('./lib/cookies');

const { WS_SERVER_PORT, WS_SECURE, WS_SERVER_ORIGIN } = process.env;

let webServer = null;

const webServerHandler = (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', WS_SERVER_ORIGIN);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();

		return;
	}

	try {
		if (web[req.url]) {
			web[req.url](req, res);
		} else {
			web.default(req, res);
		}
	} catch (error) {
		console.log('Error:', error);
	}
}

if (WS_SECURE === 'true') {
	const privateKey = fs.readFileSync('../ssl-cert/privkey.pem', 'utf8');
	const certificate = fs.readFileSync('../ssl-cert/fullchain.pem', 'utf8');
	const credentials = { key: privateKey, cert: certificate };

	webServer = https.createServer(credentials, webServerHandler);
} else {
	webServer = http.createServer(webServerHandler);
}

webServer.on('error', error => {
	console.error('Server error:', error);
});

webServer.listen(WS_SERVER_PORT);

const wss = new WebSocket.Server({ server: webServer });

const send = (ws, event, payload) => {
	ws.send(JSON.stringify({ event, payload }))
};

const spam = (data) => {
	const message = JSON.stringify(data);

	wss.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
};

ee.on('spam', spam);

const clients = {};

wss.on('connection', (ws, req) => {
	const { token } = parseCookies(req.headers.cookie);

	const filePath = getPathByToken(token);

	if (!filePath || !fs.existsSync(filePath)) {
		ws.close();

		return;
	}

	// TODO check auth
	// if not, break

	clients[token] = {
		ws,
		env: {
			cooldown: 5000,
		},
		cooldown: Date.now() + 5000,
	};

	send(ws, 'environment', {
		palette: COLORS,
		authLocation: CHAT_WINDOW_LOCATION,
		...clients[token].env,
	});

	ws.on('message', (buf) => {
		const raw = buf.toString();

		if (raw === '2') {
			ws.send(3);
			return;
		}
	});

	ws.on('close', () => {
		delete clients[token];
	})
});

module.exports = {
	spam,
}
