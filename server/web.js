const fs = require('fs');
const path = require('path');
const { canvas, drawPix } = require('./canvas');
const package = require('../package.json');
const parseCookies = require('./lib/cookies');
const {
	getAuthToken,
	getPostPayload,
} = require('./web/helpers');
const {
	checkSession,
	addSession,
} = require('./sessions');
require('dotenv').config();
const twitchAuth = require('./web/twitchAuth');

const { WS_SECURE, MAX_PIX_PER_SEC } = process.env;

const getInfo = (req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(`Place RTMP server v. ${package.version}`);
};

const getCanvas = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(canvas.toBuffer());
};

let pixList = [];

const checkAccessWrapper = async (req, res, callback) => {
	const cookie = parseCookies(req.headers.cookie || '');

	if (checkSession(cookie.token)) {
		// TODO check auth
		// TODO check ban
		// TODO check countdown

		callback();
	} else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};

const addPix = async (req, res) => {
	checkAccessWrapper(req, res, async () => {
		if (req.method === 'PUT') {
			const cookie = parseCookies(req.headers.cookie || '');
			const postPayload = await getPostPayload(req);

			let payload = {};

			try {
				payload = JSON.parse(postPayload);
			} catch (error) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				return;
			}

			if (
				pixList.length < MAX_PIX_PER_SEC ||
				(Date.now() - pixList[0]) > 1000 // TODO check per one user (authorized first)
			) {

				if (
					typeof payload.x !== 'number' ||
					typeof payload.y !== 'number' ||
					typeof payload.color !== 'string'
				) {
					res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.end('fail');
		
					return;
				}

				// TODO check prev pixel color

				pixList.push(Date.now());
				pixList = pixList.slice(-MAX_PIX_PER_SEC);

				drawPix({
					color: payload.color,
					x: Math.floor(payload.x),
					y: Math.floor(payload.y),
					nickname: '',
					uuid: cookie.token,
				});

				// send to <uuid> restart countdown timer command
				// and id for next pixel
			}
		} else {
			getInfo(req, res);
		}
	})
}

const start = (req, res) => {
	const cookie = parseCookies(req.headers.cookie || '');
	const ip = req.socket.remoteAddress;
	// const userAgent = req.headers['user-agent'];

	if (checkSession(cookie.token)) {
		// TODO check auth
		// if not, send "login"
	} else {
		const token = getAuthToken();

		if (WS_SECURE === 'true') {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly; Secure`);
		} else {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly`);
		}

		addSession(token, [ip]);

		// send "login"
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};

const getFavicon = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/x-icon' });
	fs.createReadStream('./favicon.ico').pipe(res);
};

const _default = async (req, res) => {
	if (
		!twitchAuth(req, res)
	) {
		getInfo(req, res);
	}
}

module.exports = {
	'/start': start,
	'/pix': addPix,
	'/canvas.png': getCanvas,
	'/favicon.ico': getFavicon,
	default: _default,
}
