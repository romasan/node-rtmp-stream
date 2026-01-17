import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import packageFile from '../../package.json';
import { getIPAddress } from '../helpers';
import {
	getCanvas,
	resetCountdownTemp,
	checkSession,
	checkUserAuthByToken,
	checkBan,
	getStatus,
	Log,
	getToken,
} from '../utils';
import twitchAuth from './auth/twitch';
import steamAuth from './auth/steam';
import discordAuth from './auth/discord';
import telegramAuth from './auth/telegram';
import vkAuth from './auth/vk';
import admin from './admin';
import { start } from './start';
import { pix } from './pix';
import { chat } from './chat';
import { messages } from './messages';
import { logout } from './logout';
import { stats } from './stats';
import { getStreamFrame } from './stream';

const {
	server: {
		origin,
		originAlias = [],
		anyOriginEndpoints = [],
	},
} = require('../config.json');

const checkAccessWrapper = (
	callback:
		((req: IncomingMessage, res: ServerResponse) => void) |
		((req: IncomingMessage) => void) |
		(() => void) |
		((req: IncomingMessage, res: ServerResponse) => Promise<void>) |
		((req: IncomingMessage) => Promise<void>) |
		(() => Promise<void>),
	checkAuth?: boolean,
) => {
	return async (req: IncomingMessage, res: ServerResponse) => {
		const token = getToken(req);

		if (checkSession(token)) {
			const ip = getIPAddress(req);

			if (checkBan({ token, ip })) {
				Log('Error: user is banned', token, ip);

				const randomDataStream = fs.createReadStream('/dev/random', { start: 0, end: 104857599 });
				res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': 104857600 });
				randomDataStream.pipe(res);

				return;
			}

			if (checkAuth && !checkUserAuthByToken(token)) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				Log('Error: failed check authorized');

				return;
			}

			callback(req, res);
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			const ip = getIPAddress(req);

			Log('Error: failed check access', token, ip);
		}
	};
};

const getCanvasImage = (req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(getCanvas()?.toBuffer());
};

const getFavicon = (req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, { 'Content-Type': 'image/x-icon' });
	fs.createReadStream(__dirname + '/../favicon.ico').pipe(res);
};

const getInfo = (req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(`Place RTMP server v. ${packageFile.version}`);
};

const routes: Record<string, any> = {
	'/start': start,
	'/pix': checkAccessWrapper(pix),
	'/chat': checkAccessWrapper(chat, true),
	'/messages': messages,
	'/stats': stats,
	'/auth/logout': logout,
	'/canvas.png': getCanvasImage,
	'/stream.png': getStreamFrame,
	'/favicon.ico': getFavicon,
};

export const webServerHandler = async (req: IncomingMessage, res: ServerResponse) => {
	let _origin = origin;
	
	if (
		originAlias.includes(req.headers['origin']) ||
		anyOriginEndpoints.includes(req.url)
	) {
		_origin = req.headers['origin'];
	}

	res.setHeader('Access-Control-Allow-Origin', _origin);
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
		const reqUrl = req?.url?.split('?')[0] as string;

		if (routes[reqUrl]) {
			routes[reqUrl](req, res);

			return;
		}

		if (req.url?.startsWith('/admin/')) {
			admin(req, res, { getInfo });

			return;
		}

		const _twitchAuth = await twitchAuth(req, res);
		const _steamAuth = !_twitchAuth && await steamAuth(req, res);
		const _discordAuth = !_steamAuth && await discordAuth(req, res);
		const _telegramAuth = !_discordAuth && await telegramAuth(req, res);
		const _vkAuth = !_telegramAuth && await vkAuth(req, res);
		const _isSomeAuth = _twitchAuth || _steamAuth || _discordAuth || _telegramAuth || _vkAuth;

		if (_isSomeAuth) {
			const token = getToken(req);

			resetCountdownTemp(token);

			return;
		}

		getInfo(req, res);
	} catch (error) {
		try {
			res.writeHead(200);
			res.end('fail');
		} catch (ignire) {}

		Log('Error: url handler', error);
	}
};
