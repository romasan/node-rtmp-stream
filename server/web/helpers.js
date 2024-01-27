const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const { FINISH_TIME_STAMP } = process.env;

const validateToken = (token) => {
	return typeof token === 'string' && token.match(/^[0-9a-f]{1}[0-9a-f\-]{35}$/);
};

const getPathByToken = (token = '', prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return '';
	}

	const [a, b, c] = token.split('');

	return `${__dirname}/../../db/sessions/${a}/${b}/${c}/${token}`;
};

const getPostPayload = (req) => {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk) => {
			body += chunk.toString();
		});

		req.on('end', () => {
			resolve(body);
		});

		req.on('error', () => {
			reject();
		});
	});
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

const checkStillTime = () => !FINISH_TIME_STAMP || new Date(FINISH_TIME_STAMP).getTime() > Date.now();

module.exports = {
	validateToken,
	getPathByToken,
	getPostPayload,
	inRange,
	parseCookies,
	getFileLinesCount,
	getSearch,
	isNumber,
	checkStillTime,
};
