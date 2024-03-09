const fs = require('fs');
const readline = require('readline');
const { finishTimeStamp, server: { proxyIp } } = require('../config.json');

const validateToken = (token) => {
	return typeof token === 'string' && token.match(/^[0-9a-f][0-9a-f\-]{35}$/);
};

const getPathByToken = (token = '', prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return '';
	}

	const prefix = token.slice(0, 2);

	return `${__dirname}/../../db/sessions/${prefix}/${token}`;
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

const getIPAddress = (req) => {
	if (proxyIp) {
		return req.headers['x-forwarded-for'];
	}

	return req.socket.remoteAddress;
};

const inRange = (value, [from, to]) => value >= from && value <= to;

const parseCookies = (cookies = '') => {
	return cookies
		.split(';')
		.map((item) => item.split('='))
		.reduce((list, [key, value]) => ({ ...list, [key?.trim()]: value?.trim() }), {});
};

const getFileLinesCount = (file) => new Promise((resolve) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	let count = 0;

	rl.on('line', () => {
		count++;
	});

	rl.on('close', () => {
		resolve(count);
	});
});

const getSearch = (url) => url.split('?')[1]?.split('&')
	.map((e) => e.split('='))
	.reduce((list, [key, value]) => ({ ...list, [key]: value }), {}) || {};

const isNumber = (number) => number && Number(number).toString() === number.toString();

const checkStillTime = () => !finishTimeStamp || new Date(finishTimeStamp).getTime() > Date.now();

module.exports = {
	...require('./addSessionForIP'),
	validateToken,
	getPathByToken,
	getPostPayload,
	getIPAddress,
	inRange,
	parseCookies,
	getFileLinesCount,
	getSearch,
	isNumber,
	checkStillTime,
};
