const fs = require('fs');
const readline = require('readline');
const { v4: uuid } = require('uuid');

const auth = require('../sessions/auth.json');

const getMessages = () => new Promise((resolve) => {
	const list = [];

	const rl = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../messages.log'),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		list.push(line);
	});

	rl.on('close', () => {
		resolve(list);
	});
});

const getLogoutList = () => new Promise((resolve) => {
	const list = {};

	const rl = readline.createInterface({
		input: fs.createReadStream(__dirname + '/../sessions/logout.log'),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		const [time, token, platform, name] = line.split(';');
		list[token] = name;
	});

	rl.on('close', () => {
		resolve(list);
	});
});

const fixMessagesLog = async (output) => {
	const file = fs.createWriteStream(output, { flags : 'a' });

	const rawMessages = await getMessages();
	const logoutNameList = await getLogoutList();

	rawMessages.forEach((line) => {
		const [time, token, ...rest] = line.split(';');
		const text = rest.join(';');
		const id = uuid();

		const name = auth[token]?.data?.[0]?.display_name || logoutNameList[token] || 'Guest';

		file.write([
			time,
			name,
			'twitch',
			token,
			id,
			text
		].join(';') + '\n');
	});
}

module.exports = fixMessagesLog;
