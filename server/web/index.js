const fs = require('fs');
const { v4: uuid } = require('uuid');
const {
	canvas,
	drawPix,
	getPixelColor,
	getTotalPixels,
	getTopLeaderboard,
	getCanvasConf,
	updateCanvasConf,
	updateFreezedFrame,
} = require('../canvas');
const package = require('../../package.json');
const { getPostPayload, parseCookies } = require('./helpers');
const { getExpiration } = require('./countdown');
const {
	checkSession,
	addSession,
} = require('../sessions');
const {
	checkIsAdmin,
	removeUser,
	checkUserAuthByToken,
	getUserData,
} = require('../auth');
require('dotenv').config();
const twitchAuth = require('./twitchAuth');
const { addMessage, getMessages } = require('../chat');
const { COLORS } = require('../const');

const { WS_SECURE, MAX_PIX_PER_SEC, WS_SERVER_ORIGIN, FINISH_TIME_STAMP } = process.env;

const getInfo = (req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(`Place RTMP server v. ${package.version}`);
};

const getCanvas = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(canvas.toBuffer());
};

const admin = async (req, res) => {
	const { token } = parseCookies(req.headers.cookie || '');

	if (
		checkSession(token) &&
		checkIsAdmin(token)
	) {
		const payloadRaw = ['POST', 'PUT', 'PATCH'].includes(req.method) && (await getPostPayload(req));

		let payload = {};

		try {
			payload = JSON.parse(payloadRaw);
		} catch (error) {}

		const command = req.url.split('/qq/').pop();

		switch (command) {
			case 'stat':
				const stats = {}; // getStats();

				res.writeHead(200, { 'Content-Type': 'text/json' });
				res.end(JSON.stringify(stats));
				return;
			case 'streamSettings':
				if (req.method === 'PATCH') {
					updateCanvasConf(payload);
	
					res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.end('ok');
				} else {
					res.writeHead(200, { 'Content-Type': 'text/json' });
					res.end(JSON.stringify(getCanvasConf()));
				}
				return;
			case 'updateFreezedFrame':
				updateFreezedFrame();

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('ok');
				return;
			case 'heatmap':
				// const canvas = getHeatmap();
				// res.writeHead(200, { 'Content-Type': 'image/png' });
				// res.end(canvas.toBuffer());
				return;
		}

		res.writeHead(200, { 'Content-Type': 'text/json' });
		res.end('{}');
	} else {
		getInfo(req, res);
	}
};

const checkAccessWrapper = (callback, checkAuth) => {
	return async (req, res, callbacks) => {
		const { token } = parseCookies(req.headers.cookie || '');

		if (checkSession(token)) {
			// TODO check ban

			if (checkAuth && !checkUserAuthByToken(token)) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				console.log('Error: failed check authorized');

				return;
			}

			callback(req, res, callbacks);
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed check access');

			return;
		}
	}
};

const getChatMessages = checkAccessWrapper((req, res) => {
	const messages = getMessages();

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end(JSON.stringify(messages));
});

const sendChatMessage = checkAccessWrapper(async (req, res) => {
	if (req.method === 'PUT') {
		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req);

		if (typeof postPayload === 'string') {
			addMessage(token, postPayload);

			console.log('Chat new message:', postPayload);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');
		}
	} else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');
	}
}, true);

let pixList = [];

const addPix = checkAccessWrapper(async (req, res, { updateClientCountdown }) => {
	if (FINISH_TIME_STAMP && FINISH_TIME_STAMP < Date.now()) {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		return;
	}

	if (req.method === 'PUT') {
		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req);

		let payload = {};

		try {
			payload = JSON.parse(postPayload);
		} catch (error) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed on add pixel (read payload)');

			return;
		}

		if (
			pixList.length >= MAX_PIX_PER_SEC &&
			(Date.now() - pixList[0]) < 1000 // TODO check per one user (authorized first)
		) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed on add pixel (too many pixels per second)');

			return;
		}

		if (
			typeof payload.x !== 'number' ||
			typeof payload.y !== 'number' ||
			typeof payload.color !== 'string'
		) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed on add pixel (incorrect format of pixel)');

			return;
		}

		if (Date.now() < getExpiration(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('await');

			return;
		}

		const rawColor = COLORS[payload.color];
		const pixelColor = getPixelColor(Math.floor(payload.x), Math.floor(payload.y));

		if (pixelColor === rawColor) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('skip');

			return;
		}

		pixList.push(Date.now());
		pixList = pixList.slice(-MAX_PIX_PER_SEC);

		drawPix({
			color: payload.color,
			x: Math.floor(payload.x),
			y: Math.floor(payload.y),
			nickname: '',
			uuid: token,
		});

		updateClientCountdown(token);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');
	} else {
		getInfo(req, res);
	}
});

const start = (req, res) => {
	const { token } = parseCookies(req.headers.cookie);
	const ip = req.socket.remoteAddress;
	// const userAgent = req.headers['user-agent'];

	if (checkSession(token)) {
		if (checkIsAdmin(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('qq');

			return;
		}
	} else {
		const token = uuid();

		if (WS_SECURE === 'true') {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly; Secure`);
		} else {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly`);
		}

		addSession(token, [ip]);
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};

const getFavicon = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/x-icon' });
	fs.createReadStream('./favicon.ico').pipe(res);
};

const logout = (req, res) => {
	const { token } = parseCookies(req.headers.cookie);

	removeUser(token);

	res.writeHead(302, { Location: WS_SERVER_ORIGIN });
	res.end();
};

const stats = (req, res) => {
	const total = getTotalPixels();
	const leaderboard = getTopLeaderboard()
		.map((item) => {
			const user = getUserData(item.uuid);

			return {
				name: user?.name || 'Guest',
				count: item.count,
			};
		});

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end(JSON.stringify({
		total,
		leaderboard,
	}));
};

const _default = async (req, res) => {
	if (req.url.startsWith('/qq')) {
		admin(req, res);
		return;
	}

	if (
		!await twitchAuth(req, res)
		// && !await vkPlayAuth(req, res)
		// && !await discordAuth(req, res)
		// && !await vkAuth(req, res)
	) {
		getInfo(req, res);
	}
}

module.exports = {
	'/start': start,
	'/pix': addPix,
	'/canvas.png': getCanvas,
	'/favicon.ico': getFavicon,
	'/chat': sendChatMessage,
	'/messages': getChatMessages,
	'/auth/logout': logout,
	'/stats': stats,
	default: _default,
}
