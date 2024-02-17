const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');
const http = require('http');
const ee = require('../lib/ee');
const web = require('../api');
const { getCountdown } = require('../helpers/countdown');
const { parseCookies } = require('../helpers');
const { checkSession } = require('./sessions');
const { checkUserAuthByToken, getUserData } = require('./auth');
const { getStatus } = require('../tools/getPixelsInfo');
const {
	colorShemes: { COLORS },
	server: {
		port,
		secure,
		origin,
		activityDuration,
		maxConnectionsWithOneIP,
	},
	finishTimeStamp,
	finishText,
} = require('../config.json');

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
	// if online > N use waveSpam
	const message = JSON.stringify(data);

	wss.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
};

const delay = (t = 100) => new Promise((resolve) => setTimeout(resolve, t));

const waveSpam = async (data) => {
	const message = JSON.stringify(data);
	let count = 0;

	for (const ws of wss.clients) {
		if (ws.readyState === WebSocket.OPEN) {
			count++;
			if (count % 100 === 0) {
				await delay();
			}
			ws.send(message);
		}
	}
};

ee.on('spam', spam);

const getOnlineCountRaw = () => {
	let count = 0;
	let openedCount = 0;
	let countByActivity = 0;

	wss.clients.forEach((ws) => {
		count++;

		if (ws.readyState === WebSocket.OPEN) {
			openedCount++;
		}

		if (ws._lastActivity && (Date.now() - ws._lastActivity) <= activityDuration) {
			countByActivity++;
		}
	});

	return [openedCount, count, countByActivity];
};

const getOnlineCountList = () => {
	const list = [];

	wss.clients.forEach((ws) => {
		if (ws.readyState === WebSocket.OPEN) {
			const uuid = ws._token;
			const lastActivity = ws._lastActivity;

			list.push({
				uuid,
				active: (Date.now() - lastActivity) <= Number(activityDuration),
				lastActivity,
			});
		}
	});

	return list;
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

const uptateActiveTime = (token) => {
	wss.clients.forEach((ws) => {
		if (ws._token === token) {
			ws._lastActivity = Date.now();
		}
	});
};

const checkHasWSConnect = (token) => {
	let has = false;

	wss.clients.forEach((ws) => {
		if (ws._token === token) {
			has = true;
		}
	});

	return has;
};

const checkIPRateLimit = (req) => {
	// TODO check without WS
	const ip = req.socket.remoteAddress;
	let count = 0;

	wss.clients.forEach((ws) => {
		if (ws._ip === ip) {
			count++;
		}
	});

	return count <= maxConnectionsWithOneIP ? false : count;
};

const callbacks = {
	updateClientCountdown,
	getOnlineCountRaw,
	getOnlineCount,
	uptateActiveTime,
	getOnlineCountList,
	checkHasWSConnect,
	checkIPRateLimit,
};

const webServerHandler = (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', origin);
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
};

if (secure) {
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

webServer.listen(port, 'localhost');

wss = new WebSocket.Server({ server: webServer });

wss.on('connection', (ws, req) => {
	const { token } = parseCookies(req.headers.cookie);

	if (!checkSession(token, true)) {
		ws.close();

		return;
	}

	const ip = req.socket.remoteAddress;
	const onlineCount = getOnlineCount();
	const countdown = getCountdown(token, onlineCount) * 1000;
	const isAuthorized = checkUserAuthByToken(token);
	const user = getUserData(token);

	ws._ip = ip;
	ws._token = token;
	ws._lastActivity = Date.now();

	send(token, 'init', {
		palette: COLORS,
		isAuthorized,
		...user,
		countdown,
		finish: finishTimeStamp ? new Date(finishTimeStamp).getTime() - Date.now() : 'newer',
		finishText: finishText || 'TIMEOUT',
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
};
