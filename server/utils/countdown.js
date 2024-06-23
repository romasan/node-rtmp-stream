/**
 * управление задержкой для выставления пикселя
 */

const fs = require('fs');
const { inRange } = require('../helpers');
const {
	checkUserAuthByToken,
	checkIsAdmin,
	getAuthID,
} = require('./auth');

// TODO add personal countdown
const personalCD = {
	// session ID or auth ID?
	// "00000000-0000-0000-0000-000000000000": 10 (sec.)
};

const expirationsList = {
	authorized: [
		[0, null, 3],
	],
	guest: [
		[0, null, 30],
	],
};

let countdownRanges = {};

const DBFileName = __dirname + '/../../db/countdown.json';

const preloadCountdownRanges = () => {
	// TODO use database
	if (fs.existsSync(DBFileName)) {
		countdownRanges = require(DBFileName);
	}
};

preloadCountdownRanges();

const resetCountdownTemp = (token) => {
	const _token = getAuthID(token) || token;

	delete expirationsList[_token];
};

const getExpiration = (token) => {
	const _token = getAuthID(token) || token;

	return expirationsList[_token] || 0;
};

const getCountdown = (token, onlineCount, isFirstTime, reset) => {
	if (reset) {
		resetCountdownTemp(token);
	}

	const _token = getAuthID(token) || token;

	if (expirationsList[_token]) {
		if (expirationsList[_token] > Date.now()) {
			return Math.ceil((expirationsList[_token] - Date.now()) / 1000);
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

	const value = personalCD[token]
		?? (isAuthorized ? countdownRanges.authorized : countdownRanges.guest)
			.find((item) => inRange(onlineCount, item))?.[2]
		?? 5;

	expirationsList[_token] = Date.now() + (value * 1000);

	// return Math.min(forceMin, value);
	return value;
};

const getCountdownRanges = () => {
	return countdownRanges;
};

const updateCountdownRanges = (ranges) => {
	countdownRanges = ranges;

	saveCountdownRanges();
};

const saveCountdownRanges = () => {
	fs.writeFileSync(DBFileName, JSON.stringify(countdownRanges));
};

module.exports = {
	getExpiration,
	getCountdown,
	resetCountdownTemp,
	getCountdownRanges,
	updateCountdownRanges,
	saveCountdownRanges,
};
