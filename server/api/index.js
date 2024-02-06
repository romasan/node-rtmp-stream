const fs = require('fs');
const { v4: uuid } = require('uuid');
const {
	canvas,
	drawPix,
	getPixelColor,
	getPixelAuthor,
	getTotalPixels,
	getTopLeaderboard,
} = require('../utils/canvas');
const packageFile = require('../../package.json');
const {
	getPostPayload,
	parseCookies,
	getSearch,
	isNumber,
	checkStillTime,
} = require('../helpers');
const { getExpiration, resetCountdownTemp } = require('../helpers/countdown');
const {
	checkSession,
	addSession,
	getSessionUserName,
} = require('../utils/sessions');
const {
	checkIsAdmin,
	removeUser,
	checkUserAuthByToken,
	getUserData,
} = require('../utils/auth');
const {
	checkBan,
} = require('../utils/bans');
const twitchAuth = require('./auth/twitch');
const steamAuth = require('./auth/steam');
const discordAuth = require('./auth/discord');
const { addMessage, getMessages } = require('../utils/chat');
const admin = require('./admin');
const { colorShemes: { COLORS }, server: { secure, host, timelapseCachePeriod } } = require('../config.json');

const getInfo = (req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(`Place RTMP server v. ${packageFile.version}`);
};

const getCanvas = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(canvas.toBuffer());
};

const checkAccessWrapper = (callback, checkAuth) => {
	return async (req, res, callbacks) => {
		const { token } = parseCookies(req.headers.cookie || '');

		if (checkSession(token)) {
			const ip = req.socket.remoteAddress;

			if (checkBan({ token, ip })) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				console.log('Error: user is banned', token, ip);

				return;
			}

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

			const ip = req.socket.remoteAddress;

			console.log('Error: failed check access', token, ip);
		}
	};
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

		const user = getUserData(token);

		if (checkBan({ nick: user?.name })) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed add message (banned user)', token);

			return;
		}

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

const addPix = checkAccessWrapper(async (req, res, {
	updateClientCountdown,
	uptateActiveTime,
	checkHasWSConnect,
	checkIPRateLimit,
}) => {
	if (req.method === 'PUT') {
		if (!checkStillTime()) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('timeout');
	
			return;
		}

		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req);

		if (!checkHasWSConnect(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			const ip = req.socket.remoteAddress;

			console.log('Error: failed on add pixel (send command without WS connection)', token, ip);

			return;
		}

		const IPRateLimit = checkIPRateLimit(req);

		if (IPRateLimit) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log(`Error: failed on add pixel (too many requests from one ip - ${IPRateLimit})`);

			return;
		}

		let payload = {};

		uptateActiveTime(token);

		try {
			payload = JSON.parse(postPayload);
		} catch (error) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed on add pixel (read payload)');

			return;
		}

		const user = getUserData(token);

		const ip = req.socket.remoteAddress;

		if (checkBan({ nick: user?.name })) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed on add pixel (banned user)', token, ip);

			return;
		}

		if (
			typeof payload.x !== 'number' ||
			typeof payload.y !== 'number' ||
			typeof payload.color !== 'string'
		) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed on add pixel (incorrect format of pixel)', payload, token, ip);

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

		drawPix({
			color: payload.color,
			x: Math.floor(payload.x),
			y: Math.floor(payload.y),
			nickname: '',
			uuid: token,
			ip,
		});

		updateClientCountdown(token);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');
	} else {
		const { x, y } = getSearch(req.url);
		const { uuid, time } = getPixelAuthor(x, y);
		const user = getUserData(uuid);
		const color = getPixelColor(x, y);

		const finished = !checkStillTime();

		const _time = finished
			? time
			: (Date.now() - time);

		if (isNumber(x) && isNumber(y)) {
			res.writeHead(200, { 'Content-Type': 'text/json' });
			res.end(JSON.stringify({
				x: Number(x),
				y: Number(y),
				time: time ? _time : -1,
				...(color && {
					color,
					name: user?.name || getSessionUserName(uuid),
				}),
			}));
		} else {
			getInfo(req, res);
		}
	}
});

const start = (req, res, {
	checkIPRateLimit,
}) => {
	const { token } = parseCookies(req.headers.cookie);
	const ip = req.socket.remoteAddress;
	// const userAgent = req.headers['user-agent'];

	const IPRateLimit = checkIPRateLimit(req);

	if (IPRateLimit) {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		console.log(`Error: failed start session (too many requests from one ip - ${IPRateLimit})`, token);

		return;
	}

	if (checkBan({ ip, token })) {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	if (checkSession(token)) {
		if (checkIsAdmin(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('qq');

			addSession(token, ip);

			return;
		}
	} else {
		const token = uuid();

		if (secure) {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly; Secure`);
		} else {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly`);
		}
	}

	addSession(token, ip);

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

	res.writeHead(302, { Location: host });
	res.end();
};

const stats = (req, res) => {
	const { token } = parseCookies(req.headers.cookie);
	const total = getTotalPixels();
	const leaderboard = getTopLeaderboard(10, token)
		.map((item) => {
			const user = getUserData(item.id);

			return {
				name: user?.name || getSessionUserName(item.id),
				count: item.count,
				place: item.place,
			};
		});

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end(JSON.stringify({
		total,
		leaderboard,
	}));
};

const contentTypes = {
	json: 'text/json',
	bin: 'application/octet-stream',
};

const timelapse = (req, res) => {
	if (req.url.startsWith('/timelapse/')) {
		try {
			const parts = req.url.split('/');
			const [,, season, file] = parts;
			const filePath = `${__dirname}/../../db/archive/${season}/timelapse/${file}`;
			const ext = file?.split('.').pop();

			if (!fs.existsSync(filePath)) {
				throw new Error();
			}
			
			res.setHeader('Cache-control', `public, max-age=${timelapseCachePeriod}`);
			res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
			const readStream = fs.createReadStream(filePath);
			readStream.pipe(res);
		} catch (e) {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: get timelapse file', req.url, e);
		}

		return true;
	}

	return false;
};

const _default = async (req, res, callbacks) => {
	if (req.url.startsWith('/qq/')) {
		admin(req, res, { getInfo, ...callbacks });

		return;
	}

	if (
		!await twitchAuth(req, res) &&
		!await steamAuth(req, res) &&
		!await discordAuth(req, res) &&
		// && !await vkPlayAuth(req, res)
		// && !await discordAuth(req, res)
		// && !await vkAuth(req, res)
		!timelapse(req, res)
	) {
		getInfo(req, res);
	} else {
		const { token } = parseCookies(req.headers.cookie || '');

		resetCountdownTemp(token);
	}
};

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
};