import { v4 as uuid } from 'uuid';
import { IncomingMessage, ServerResponse } from 'http';
import { parseCookies, getIPAddress } from '../helpers';
import { checkIPRateLimit } from '../utils/ws';
import { checkBan } from '../utils/bans';
import { checkSession, addSession } from '../utils/sessions';
import { checkIsAdmin } from '../utils/auth';
import { Log } from '../utils/log';

const { server: { secure } } = require('../config.json');

export const start = (req: IncomingMessage, res: ServerResponse) => {
	const { token } = parseCookies(req.headers.cookie);
	const ip = getIPAddress(req) || '';
	// const userAgent = req.headers['user-agent'];

	const IPRateLimit = checkIPRateLimit(req);

	if (IPRateLimit) {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		Log(`Error: failed start session (too many requests from one ip - ${IPRateLimit})`, token);

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

			return;
		}

		addSession(token, ip);
	} else {
		const newToken = uuid();

		if (secure) {
			res.setHeader('Set-Cookie', `token=${newToken}; Max-Age=31536000; HttpOnly; Secure`);
		} else {
			res.setHeader('Set-Cookie', `token=${newToken}; Max-Age=31536000; HttpOnly`);
		}

		addSession(newToken, ip);
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};
