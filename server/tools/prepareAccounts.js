const fs = require('fs');

const prepareAccounts = (output) => {
	const filePath = __dirname + '/../../db/auth.json';
	const auth = require(filePath);

	auth.accounts = Object.entries(auth.sessions).reduce((list, [token, authKey]) => ({
		...list,
		[authKey]: [...(list[authKey] || []), token],
	}), {});

	fs.writeFileSync(output || filePath, JSON.stringify(auth));
};

const humanListToArray = (obj) => Object.entries(obj)
	.reduce((list, [key, value]) => [...list, [Number(key), value]], [])
	.map(([key, value], index, list) => [key, (list[index + 1]?.[0] || Infinity) - 1, value]);

const prepareContdownConfig = () => {
	const config = require(__dirname + '/../config.json');

	const countdownRanges = Object.entries(config.countdownRanges)
		.reduce((list, [key, value]) => ({
			...list,
			[key]: humanListToArray(value),
		}), {});

	fs.writeFileSync(__dirname + '/../../db/countdown.json', JSON.stringify(countdownRanges));
};

module.exports = {
	prepareAccounts,
	prepareContdownConfig,
};
