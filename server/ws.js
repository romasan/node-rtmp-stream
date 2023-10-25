const WebSocket = require('ws')
const fs = require('fs');
const https = require('https');
const http = require('http');
const ee = require('./lib/ee');
const web = require('./web');
const { getCountdown } = require('./web/countdown');
const { checkFirstTime, checkSession } = require('./sessions');
const { COLORS } = require('./const');
const { parseCookies } = require('./web/helpers');
const { checkUserAuthByToken, getUserData } = require('./auth');
require('dotenv').config();
const { getStatus } = require('./tools/getPixelsInfo');

const { WS_SERVER_PORT, WS_SECURE, WS_SERVER_ORIGIN, FINISH_TIME_STAMP } = process.env;

let webServer = null;
let wss = null;

const send = (token, event, payload) => {
	wss.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN && ws._token === token) {
			ws.send(JSON.stringify({ event, payload }));
		}
	});
};

const updateClientCountdown = (token) => {
	const onlineCount = getOnlineCount();
	const countdown = getCountdown(token, onlineCount, false, true) * 1000;

	send(token, 'countdown', countdown);
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

const getOnlineCountRaw = () => {
	let count = 0;
	let openedCount = 0;

	wss.clients.forEach((ws) => {
		count++;
		if (ws.readyState === WebSocket.OPEN) {
			openedCount++;
		}
	});

	return [openedCount, count];
};

let updatedCacheTime = 0;
let cachedOnline = 0;
const getOnlineCount = () => {
	if (Date.now() - updatedCacheTime < 5_000) {
		return cachedOnline;
	}

	updatedCacheTime = Date.now();

	const list = [];

	wss.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN) {
			if (!list.includes(ws._token)) {
				list.push(ws._token);
			}
		}
	});

	cachedOnline = list.length;

	return cachedOnline;
};

const callbacks = {
	updateClientCountdown,
	getOnlineCountRaw,
	getOnlineCount,
};

const webServerHandler = (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', WS_SERVER_ORIGIN);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	if (!getStatus()) {
		res.writeHead(200);
		res.end('init');

		return;
	}

	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();

		return;
	}

	try {
		const reqUrl = req.url.split('?')[0];
		const key = web[reqUrl] ? reqUrl : 'default';

		web[key](req, res, callbacks);
	} catch (error) {
		res.writeHead(200);
		res.end('fail');

		console.log('Error: url handler', error);
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

wss = new WebSocket.Server({ server: webServer });

wss.on('connection', (ws, req) => {
	const { token } = parseCookies(req.headers.cookie);

	if (!checkSession(token, true, false)) {
		ws.close();

		return;
	}

	const onlineCount = getOnlineCount();
	const isFirstTime = checkFirstTime(token);
	const countdown = getCountdown(token, onlineCount, isFirstTime) * 1000;
	const isAuthorized = checkUserAuthByToken(token);
	const user = getUserData(token);

	ws._token = token;

	send(token, 'init', {
		palette: COLORS,
		isAuthorized,
		...user,
		countdown,
		finish: FINISH_TIME_STAMP ? new Date(FINISH_TIME_STAMP).getTime() - Date.now() : 'newer',
	});

	ws.on('message', (buf) => {
		const raw = buf.toString();

		if (raw === '2') {
			ws.send(3);
			return;
		}
	});
});

module.exports = {
	spam,
}
