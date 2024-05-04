const fs = require('fs');
const { canvas } = require('../utils/canvas');
const packageFile = require('../../package.json');
const {
	parseCookies,
	getIPAddress,
} = require('../helpers');
const { resetCountdownTemp } = require('../utils/countdown');
const { checkSession } = require('../utils/sessions');
const { checkUserAuthByToken } = require('../utils/auth');
const { checkBan } = require('../utils/bans');
const twitchAuth = require('./auth/twitch');
const steamAuth = require('./auth/steam');
const discordAuth = require('./auth/discord');
const admin = require('./admin');
const { getStatus } = require('../utils/stats');
const { start } = require('./start');
const { pix } = require('./pix');
const { chat } = require('./chat');
const { messages } = require('./messages');
const { logout } = require('./logout');
const { stats } = require('./stats');
const { timelapse } = require('./timelapse');
const { server: { origin } } = require('../config.json');

const checkAccessWrapper = (callback, checkAuth) => {
	return async (req, res) => {
		const { token } = parseCookies(req.headers.cookie || '');

		if (checkSession(token)) {
			const ip = getIPAddress(req);

			if (checkBan({ token, ip })) {
				// res.writeHead(200, { 'Content-Type': 'text/plain' });
				// res.end('fail');

				console.log('Error: user is banned', token, ip);

				const randomDataStream = fs.createReadStream('/dev/random', { start: 0, end: 104857599 });
				res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': 104857600 });
				randomDataStream.pipe(res);

				return;
			}

			if (checkAuth && !checkUserAuthByToken(token)) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				console.log('Error: failed check authorized');

				return;
			}

			callback(req, res);
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			const ip = getIPAddress(req);

			console.log('Error: failed check access', token, ip);
		}
	};
};

const getCanvas = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(canvas.toBuffer());
};

const getFavicon = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/x-icon' });
	fs.createReadStream('./favicon.ico').pipe(res);
};

const getInfo = (req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(`Place RTMP server v. ${packageFile.version}`);
};

const routes = {
	'/start': start,
	'/pix': checkAccessWrapper(pix),
	'/chat': checkAccessWrapper(chat, true),
	'/messages': checkAccessWrapper(messages),
	'/stats': stats,
	'/auth/logout': logout,
	'/canvas.png': getCanvas,
	'/favicon.ico': getFavicon,
};

const webServerHandler = async (req, res) => {
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

		if (routes[reqUrl]) {
			routes[reqUrl](req, res);

			return;
		}

		if (req.url.startsWith('/admin/')) {
			admin(req, res, { getInfo });

			return;
		}

		if (
			!await twitchAuth(req, res) &&
			!await steamAuth(req, res) &&
			!await discordAuth(req, res) &&
			// && !await vkPlayAuth(req, res)
			// && !await vkAuth(req, res)
			!timelapse(req, res)
		) {
			getInfo(req, res);
		} else {
			const { token } = parseCookies(req.headers.cookie || '');

			resetCountdownTemp(token);
		}
	} catch (error) {
		res.writeHead(200);
		res.end('fail');

		console.log('Error: url handler', error);
	}
};

module.exports = {
	webServerHandler,
};
