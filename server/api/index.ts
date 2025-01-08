import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { getCanvas } from '../utils/canvas';
import packageFile from '../../package.json';
import {
	parseCookies,
	getIPAddress,
} from '../helpers';
import { resetCountdownTemp } from '../utils/countdown';
import { checkSession } from '../utils/sessions';
import { checkUserAuthByToken } from '../utils/auth';
import { checkBan } from '../utils/bans';
import twitchAuth from './auth/twitch';
import steamAuth from './auth/steam';
import discordAuth from './auth/discord';
import telegramAuth from './auth/telegram';
import admin from './admin';
import { getStatus } from '../utils/stats';
import { start } from './start';
import { pix } from './pix';
import { chat } from './chat';
import { messages } from './messages';
import { logout } from './logout';
import { stats } from './stats';
import { Log } from '../utils/log';

const { server: { origin } } = require('../config.json');

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
		const { token } = parseCookies(req.headers.cookie || '');

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
	fs.createReadStream('./favicon.ico').pipe(res);
};

const getInfo = (req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(`Place RTMP server v. ${packageFile.version}`);
};

const routes: Record<string, any> = {
	'/start': start,
	'/pix': checkAccessWrapper(pix),
	'/chat': checkAccessWrapper(chat, true),
	'/messages': checkAccessWrapper(messages),
	'/stats': stats,
	'/auth/logout': logout,
	'/canvas.png': getCanvasImage,
	'/favicon.ico': getFavicon,
};

export const webServerHandler = async (req: IncomingMessage, res: ServerResponse) => {
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
		const reqUrl = req?.url?.split('?')[0] as string;

		if (routes[reqUrl]) {
			routes[reqUrl](req, res);

			return;
		}

		if (req.url?.startsWith('/admin/')) {
			admin(req, res, { getInfo });

			return;
		}

		if (
			!await twitchAuth(req, res) &&
			!await steamAuth(req, res) &&
			!await discordAuth(req, res) &&
			!telegramAuth(req, res)
		) {
			getInfo(req, res);
		} else {
			const { token } = parseCookies(req.headers.cookie || '');

			resetCountdownTemp(token);
		}
	} catch (error) {
		try {
			res.writeHead(200);
			res.end('fail');
		} catch (ignire) {}

		Log('Error: url handler', error);
	}
};
