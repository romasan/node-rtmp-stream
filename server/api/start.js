const { v4: uuid } = require('uuid');
const { parseCookies, getIPAddress } = require('../helpers');
const { checkIPRateLimit } = require('../utils/ws');
const { checkBan } = require('../utils/bans');
const { checkSession, addSession } = require('../utils/sessions');
const { checkIsAdmin } = require('../utils/auth');
const { server: { secure } } = require('../config.json');

const start = (req, res) => {
	const { token } = parseCookies(req.headers.cookie);
	const ip = getIPAddress(req);
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

module.exports = {
	start,
};