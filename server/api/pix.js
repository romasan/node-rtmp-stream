const {
	checkStillTime,
	parseCookies,
	getPostPayload,
	getIPAddress,
	getSearch,
	isNumber,
} = require('../helpers');
const { checkUserAuthByToken, getUserData } = require('../utils/auth');
const {
	checkHasWSConnect,
	checkIPRateLimit,
	uptateActiveTime,
	updateClientCountdown,
} = require('../utils/ws');
const { checkBan } = require('../utils/bans');
const { getExpiration } = require('../utils/countdown');
const {
	getPixelColor,
	drawPix,
	getPixelAuthor,
} = require('../utils/canvas');
const { getSessionUserName } = require('../utils/sessions');
const {
	colorShemes: { COLORS },
	guestCanPlay,
} = require('../config.json');

const pix = async (req, res) => {
	if (req.method === 'PUT') {
		if (!checkStillTime()) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('timeout');

			return;
		}

		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req);

		if (!guestCanPlay && !checkUserAuthByToken(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			console.log('Error: failed check authorized');

			return;
		}

		if (!checkHasWSConnect(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			const ip = getIPAddress(req);

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

		const ip = getIPAddress(req);

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
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');
		}
	}
};

module.exports = {
	pix,
};
