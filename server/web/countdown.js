const { inRange } = require('./helpers');
const { countdownRanges } = require('../const.json');
const { checkUserAuthByToken, checkIsAdmin } = require('../auth');

const humanListToArray = (obj) => Object.entries(obj)
	.reduce((list, [key, value]) => [...list, [Number(key), value]], [])
	.map(([key, value], index, list) => [key, (list[index + 1]?.[0] || Infinity) - 1, value]);

let _countdownRanges = Object.entries(countdownRanges)
	.reduce((list, [key, value]) => ({
		...list,
		[key]: humanListToArray(value),
	}), {});

const expirationsList = {};

const resetCountdownTemp = (token) => {
	delete expirationsList[token];
};

const getExpiration = (token) => {
	return expirationsList[token] || 0;
};

const getCountdown = (token, onlineCount, isFirstTime, reset) => {
	if (reset) {
		resetCountdownTemp(token);
	}

	// TODO one countdown for all sessions with one login
	// const _token = getAuthID(token) || token;

	if (expirationsList[token]) {
		if (expirationsList[token] > Date.now()) {
			return Math.ceil((expirationsList[token] - Date.now()) / 1000);
		} else {
			return 0;
		}
	}

	// const forceMin = Infinity;
	const isAdmin = checkIsAdmin(token);
	const isAuthorized = checkUserAuthByToken(token);

	if (isAdmin || isFirstTime) {
		return 0;
	}

	// if (forceMin) {
	// 	return forceMin;
	// }

	const value = (isAuthorized ? _countdownRanges.authorized : _countdownRanges.guest)
		.find((item) => inRange(onlineCount, item))?.[2] ?? 5;

	expirationsList[token] = Date.now() + (value * 1000);

	// return Math.min(forceMin, value);
	return value;
};

module.exports = {
	getExpiration,
	getCountdown,
	resetCountdownTemp,
};
