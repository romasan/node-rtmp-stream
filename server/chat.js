const fs = require('fs');
const readline = require('readline');
const { v4: uuid } = require('uuid');
const { getUserData } = require('./auth');
const ee = require('./lib/ee');

const LIST_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

const messagesFile = __dirname + '/messages.log';

let messages = [];

const getFileLinesCount = (file) => new Promise((resolve) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	let count = 0;

	rl.on('line', (line) => {
		count++;
	});

	rl.on('close', () => {
		resolve(count);
	});
});

getFileLinesCount(messagesFile).then((count) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(messagesFile),
		crlfDelay: Infinity
	});

	let index = 0;

	rl.on('line', (line) => {
		index++;

		if (index > count - LIST_LENGTH) {

			const [
				time,
				name,
				platform,
				token,
				id,
				...rest
			] = line.split(';');
			const text = rest.join(';');

			const message = {
				id,
				time,
				text,
				name,
			};

			messages.push(message);
		}
	});
})

const messagesLog = fs.createWriteStream(messagesFile, { flags : 'a' });

const addMessage = (
	token,
	text,
) => {
	if (!text) {
		return;
	}

	text = text
		.slice(0, MAX_MESSAGE_LENGTH)
		.replace(/\</g, '&lt;')
		.replace(/\>/g, '&gt;')
		.replace(/[\r\n]+/g, ' ');

	const user = getUserData(token);

	const message = {
		id: uuid(),
		time: Date.now(),
		text,
		...user,
	};

	messages = [
		...messages.slice(-(LIST_LENGTH - 1)),
		message,
	];

	ee.emit('spam', {
		event: 'chatMessage',
		payload: message,
	});

	messagesLog.write([
		Date.now(),
		user.name,
		'twitch',
		token,
		message.id,
		text,
	].join(';') + '\n');
};

const getMessages = () => {
	return messages;
}

module.exports = {
	addMessage,
	getMessages,
}
