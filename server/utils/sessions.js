const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { addSessionForIP } = require('../helpers');

const {
	validateToken,
	getPathByToken,
} = require('../helpers');

let sessions = {};
let failed = {};

const maxLength = 1000;
const gap = 100;

let index = 0;

const rl = readline.createInterface({
	input: fs.createReadStream(__dirname + '/../../db/list'),
	crlfDelay: Infinity
});

rl.on('line', (uuid) => {
	sessions[uuid] = ++index;
});

const tokensFile = fs.createWriteStream(__dirname + '/../../db/list', { flags : 'a' });
// const ipFile = fs.createWriteStream(__dirname + '/../../db/iplist', { flags : 'a' });

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
};

const checkSession = (token, prevalidate = true) => {
	if (prevalidate && !validateToken(token)) {
		return false;
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

const addSession = (token, ip) => {
	const filePath = getPathByToken(token, false);
	const dirname = path.dirname(filePath);

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}

	const fileContent = [Date.now(), ip].join(';') + '\n';

	if (fs.existsSync(filePath)) {
		fs.appendFileSync(filePath, fileContent);
	} else {
		tokensFile.write(token + '\n');
		// ipFile.write(ip + '\n');
		fs.writeFileSync(filePath, fileContent);
		sessions[token] = ++index;
	}

	addSessionForIP(ip, token);

	delete failed[token];
	// trimSessions();
};

const getSessionUserName = (token) => {
	const guestIndex = sessions[token] || '';

	return `Гость${guestIndex}`;
};

module.exports = {
	checkSession,
	addSession,
	getSessionUserName,
};
