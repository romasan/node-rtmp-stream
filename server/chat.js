const fs = require('fs');
const { v4: uuid } = require('uuid');
const { getUserData } = require('./auth');
const ee = require('./lib/ee');

const LIST_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

let messages = [];

const messagesLog = fs.createWriteStream(__dirname + '/messages.log', { flags : 'a' });

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
		.replace(/\>/g, '&gt;');

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
		token,
		// message.id,
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
