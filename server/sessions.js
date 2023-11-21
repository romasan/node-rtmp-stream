const fs = require('fs');
const readline = require('readline');
const path = require('path');

const {
	validateToken,
	getPathByToken,
} = require('./web/helpers');

let sessions = {};
let failed = {};

const maxLength = 1000;
const gap = 100;

/*
 * TODO
	{
		"TOKEN": { DATA }
	}
	->
	{
		"sessions": {
			"SESSION_ID": { DATA }
		},
		"tokens": {
			"TOKEN": "SESSION_ID"
		}
	}
*/

let index = 0;

const rl = readline.createInterface({
	input: fs.createReadStream(__dirname + '/../db/list'),
	crlfDelay: Infinity
});

rl.on('line', (uuid) => {
	sessions[uuid] = ++index;
});

const file = fs.createWriteStream(__dirname + '/../db/list', { flags : 'a' });

const trim = (obj) => {
	return Object.entries(obj)
		.sort(([, a], [, b]) => a > b ? 1 : -1)
		.slice(-maxLength)
		.reduce((list, [key, value]) => ({ ...list, [key]: value }), {});
};

// const trimSessions = () => {
// 	if (Object.keys(sessions).length > (maxLength + gap)) {
// 		sessions = trim(sessions);
// 	}
// };

const trimFailed = () => {
	if (Object.keys(failed).length > (maxLength + gap)) {
		failed = trim(failed);
	}
}

const tempFirstTime = {}

const checkSession = (token, prevalidate = true, skipFirstTime = true) => {
	if (prevalidate && !validateToken(token)) {
		return false;
	}

	if (skipFirstTime) {
		delete tempFirstTime[token];
	}

	if (sessions[token]) {
		return true;
	}

	if (failed[token]) {
		return false;
	}

	const filePath = getPathByToken(token, false);

	if (fs.existsSync(filePath)) {
		// sessions[token] = Date.now();

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
		sessions[token] = ++index;
	}

	delete failed[token];
	// trimSessions();
}

const checkFirstTime = (token) => {
	return token in tempFirstTime;
};

const getSessionUserName = (token) => {
	const guestIndex = sessions[token] || '';

	return `Гость${guestIndex}`;
};

module.exports = {
	checkSession,
	addSession,
	checkFirstTime,
	getSessionUserName,
};
