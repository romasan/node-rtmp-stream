const http = require('http');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

const {
	server: {
		auth: {
			telegram: { token }
		},
	},
} = require('../config.json');

const parseCookies = (cookies = '') => {
	return cookies
		.split(';')
		.map((item) => item.split('='))
		.reduce((list, [key, value]) => ({ ...list, [key?.trim()]: value?.trim() }), {});
};

const getPostPayload = (req, type = 'text') => {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk) => {
			body += chunk.toString();
		});

		req.on('end', () => {
			if (type === 'json') {
				let json = {};

				try {
					json = JSON.parse(body);
				} catch (ignore) {/* */}

				resolve(json);

				return;
			}

			resolve(body);
		});

		req.on('error', () => {
			reject();
		});
	});
};

const checkTelegramAuth = (query, isWebApp = false) => {
	const secret = (isWebApp ? crypto.createHmac('sha256', 'WebAppData') : crypto.createHash('sha256'))
		.update(token)
		.digest();
	const checkString = Object.keys(query)
		.filter(key => key !== 'hash')
		.sort()
		.map(key => `${key}=${query[key]}`)
		.join('\n');
	const hash = crypto.createHmac('sha256', secret)
		.update(checkString)
		.digest('hex');

	return hash === query.hash;
};

const callback = async (req, res) => {
	const { token: prevToken } = parseCookies(req.headers.cookie || '');
	const payload = await getPostPayload(req);
	const params = Object.fromEntries(new URLSearchParams(payload));

	let user = {};
	try {
		user = JSON.parse(params.user);
	} catch (error) {
		console.log(`Error: ${error}`);
	}

	const valid = checkTelegramAuth(params);

	const newToken = uuid();

	console.log('==== origin:', req.headers['origin']);
	console.log('==== url:', req.url);
	console.log('==== prev token:', prevToken);
	console.log('==== new token:', newToken);
	console.log('==== valid:', valid);
	console.log('==== user:', user);

	res.setHeader('Access-Control-Allow-Origin', 'https://tg.pixelbattles.ru');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	res.setHeader('Set-Cookie', `token=${newToken}; Max-Age=31536000; HttpOnly`);

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('=)');
};

const debugServer = (port) => {
	webServer = http.createServer(callback);

	webServer.listen(port, 'localhost');
};

module.exports = {
	debugServer,
};
