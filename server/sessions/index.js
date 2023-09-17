const fs = require('fs');
const path = require('path');

const {
	validateToken,
	getPathByToken,
} = require('../web/helpers');

let sessions = {};
let failed = {};

const maxLength = 1000;
const gap = 100;

const file = fs.createWriteStream(__dirname + '/list', { flags : 'a' });

const trim = (obj) => {
	return Object.entries(obj)
		.sort(([, a], [, b]) => a > b ? 1 : -1)
		.slice(-maxLength)
		.reduce((list, [key, value]) => ({ ...list, [key]: value }), {});
};

const trimSessions = () => {
	if (Object.keys(sessions).length > (maxLength + gap)) {
		sessions = trim(sessions);
	}
};

const trimFailed = () => {
	if (Object.keys(failed).length > (maxLength + gap)) {
		failed = trim(failed);
	}
}

const tempFirstTime = {}

const checkSession = (token, prevalidate = true) => {
	delete tempFirstTime[token];

	if (sessions[token]) {
		return true;
	}

	if (failed[token]) {
		return false;
	}

	if (prevalidate && !validateToken(token)) {
		return false;
	}

	const filePath = getPathByToken(token, false);

	if (fs.existsSync(filePath)) {
		sessions[token] = Date.now();

		return true;
	} else {
		failed[token] = Date.now();
		trimFailed();

		return false;
	}
};

const addSession = (token, data) => {
	tempFirstTime[token] = true;

	const filePath = getPathByToken(token, false);
	const dirname = path.dirname(filePath);

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}

	const fileContent = [
		Date.now(),
		...data,
	].join(';') + '\n';

	if (fs.existsSync(filePath)) {
		fs.appendFileSync(filePath, fileContent);
	} else {
		file.write(token + '\n');
		fs.writeFileSync(filePath, fileContent);
	}

	sessions[token] = Date.now();
	delete failed[token];
	trimSessions();
}

const checkFirstTime = (token) => {
	return token in tempFirstTime;
};

module.exports = {
	checkSession,
	addSession,
	checkFirstTime,
};
