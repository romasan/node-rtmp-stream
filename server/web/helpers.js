const { v4: uuid } = require('uuid');
const { countdownRanges } = require('../const');

const getAuthToken = () => {
	return uuid();
};

const validateToken = (token) => {
	return typeof token === 'string' && token.match(/^[0-9a-f]{1}[0-9a-f\-]{35}$/);
};

const getPathByToken = (token = '', prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return '';
	}

	const [a, b, c] = token.split('');

	return `./sessions/${a}/${b}/${c}/${token}`;
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

const humanListToArray = (obj) => Object.entries(obj)
	.reduce((list, [key, value]) => [...list, [Number(key), value]], [])
	.map(([key, value], index, list) => [key, (list[index + 1]?.[0] || Infinity) - 1, value]);

let _countdownRanges = Object.entries(countdownRanges)
	.reduce((list, [key, value]) => ({
		...list,
		[key]: humanListToArray(value),
	}), {});

const getCountdown = (token) => {
	const isAdmin = false;
	const isAuthorized = true;
	const onlineCount = 10;
	const isFirstTime = false;

	if (isAdmin || isFirstTime) {
		return 0;
	}

	return (isAuthorized ? _countdownRanges.authorized : _countdownRanges.guest)
		.filter((item) => inRange(onlineCount, item))?.[2] || 5;
}

module.exports = {
	getAuthToken,
	validateToken,
	getPathByToken,
	getPostPayload,
	getCountdown,
};
