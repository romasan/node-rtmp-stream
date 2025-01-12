import { IncomingMessage, ServerResponse } from 'http';
import {
	checkStillTime,
	parseCookies,
	getPostPayload,
	getIPAddress,
	getSearch,
	isNumber,
} from '../helpers';
import { checkUserAuthByToken, getUserData } from '../utils/auth';
import {
	checkHasWSConnect,
	checkIPRateLimit,
	uptateActiveTime,
	updateClientCountdown,
} from '../utils/ws';
import { checkBan } from '../utils/bans';
import { getExpiration } from '../utils/countdown';
import { drawPix } from '../utils/canvas';
import {
	getPixelColor,
	getPixelAuthor,
} from '../utils/stats';
import { Log } from '../utils/log';

const {
	colorShemes: { COLORS },
} = require('../config.json');

export const pix = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		if (!checkStillTime()) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('timeout');

			return;
		}

		const { token } = parseCookies(req.headers.cookie);
		const postPayload: any = await getPostPayload(req);

		if (!checkUserAuthByToken(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: failed check authorized');

			return;
		}

		if (!checkHasWSConnect(token)) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			const ip = getIPAddress(req);

			Log('Error: failed on add pixel (send command without WS connection)', token, ip);

			return;
		}

		const IPRateLimit = checkIPRateLimit(req);

		if (IPRateLimit) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log(`Error: failed on add pixel (too many requests from one ip - ${IPRateLimit})`);

			return;
		}

		let payload: any = {};

		uptateActiveTime(token);

		try {
			payload = JSON.parse(postPayload);
		} catch (error) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: failed on add pixel (read payload)');

			return;
		}

		const user: any = getUserData(token);

		const ip = getIPAddress(req);

		if (checkBan({ nick: user?.name })) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: failed on add pixel (banned user)', token, ip);

			return;
		}

		if (
			typeof payload.x !== 'number' ||
			typeof payload.y !== 'number' ||
			typeof payload.color !== 'string'
		) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: failed on add pixel (incorrect format of pixel)', payload, token, ip);

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
			nickname: user?.name || '',
			area: user?.area || '',
			uuid: token,
			ip,
		});

		updateClientCountdown(token);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	const { x, y } = getSearch(req.url as string) as any;
	const { area, nickname, time } = getPixelAuthor(x, y);
	const color = getPixelColor(x, y);

	const finished = !checkStillTime();

	const _time = finished
		? time
		: (Date.now() - time);

	if (isNumber(x) && isNumber(y)) {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({
			x: Number(x),
			y: Number(y),
			time: time ? _time : -1,
			...(color && {
				color,
				area,
				name: nickname,
			}),
		}));

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');
};
