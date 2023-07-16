const fs = require('fs');
const path = require('path');
const { canvas, drawPix } = require('./canvas');
const package = require('../package.json');
const parseCookies = require('./lib/cookies');
const {
	getAuthToken,
	validateToken,
	getPathByToken,
	getPostPayload,
} = require('./web/helpers');
require('dotenv').config();

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

const addPix = async (req, res) => {

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
			typeof payload.x !== 'number' ||
			typeof payload.y !== 'number' ||
			typeof payload.color !== 'string'
		) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			return;
		}

		if (cookie.token) {
			if (!validateToken(cookie.token)) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				return;
			}

			const filePath = getPathByToken(cookie.token, false);

			// TODO check auth
			// remove check file

			if (fs.existsSync(filePath)) {
				if (
					pixList.length < MAX_PIX_PER_SEC ||
					(Date.now() - pixList[0]) > 1000
				) {
					// check cooldown

					pixList.push(Date.now());
					pixList = pixList.slice(-MAX_PIX_PER_SEC);

					drawPix({
						color: payload.color,
						x: Math.floor(payload.x),
						y: Math.floor(payload.y),
						nickname: '',
						uuid: cookie.token,
					});

					// send to <uuid> restart cooldown command
				}
			}
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	getInfo(req, res);
};

const start = (req, res) => {
	const cookie = parseCookies(req.headers.cookie || '');
	const ip = req.socket.remoteAddress;
	// const userAgent = req.headers['user-agent'];

	let token = cookie.token || getAuthToken();

	if (!validateToken(token)) {
		res.setHeader('Set-Cookie', `token=; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		return;
	}

	if (!cookie.token) {
		if (WS_SECURE === 'true') {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly; Secure`);
		} else {
			res.setHeader('Set-Cookie', `token=${token}; Max-Age=31536000; HttpOnly`);
		}
	}

	const filePath = getPathByToken(token, false);
	const fileContent = [
		Date.now(),
		ip,
	].join(';') + '\n';

	const dirname = path.dirname(filePath);

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}

	// TODO check auth
	// if not, send "login"

	if (fs.existsSync(filePath)) {
		fs.appendFileSync(filePath, fileContent);
	} else {
		if (!cookie.token) {
			fs.writeFileSync(filePath, fileContent);
		} else {
			// TODO if not authorized
			// else create new file
			res.setHeader('Set-Cookie', `token=; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			return;
		}
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};

const getFavicon = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'image/x-icon' });
	fs.createReadStream('./favicon.ico').pipe(res);
};

module.exports = {
	'/start': start,
	'/pix': addPix,
	'/canvas.png': getCanvas,
	'/favicon.ico': getFavicon,
	default: getInfo,
}
