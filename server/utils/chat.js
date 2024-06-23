/**
 * чат
 */

const { v4: uuid } = require('uuid');
const { getUserData } = require('./auth');
const { spam } = require('../utils/ws');
const { db, asyncQuery, insert } = require('../utils/db');
const BadWordsNext = require('bad-words-next');
const ru = require('bad-words-next/data/ru.json');

const badwords = new BadWordsNext({ data: ru });

const LIST_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

let cache = [];
let updated = true;

const addSystemMessage = (text) => {
	const message = {
		id: uuid(),
		time: Date.now(),
		text,
		name: 'Admin',
		area: 'system',
	};

	spam({
		event: 'chatMessage',
		payload: message,
	});

	insert('chat', {
		time: message.time,
		id: message.id,
		name: message.name,
		area: message.area,
		token: '00000000-0000-0000-0000-000000000000',
		text,
	});
};

const addMessage = (
	token,
	text,
) => {
	if (!text) {
		return;
	}

	updated = true;

	text = text
		.slice(0, MAX_MESSAGE_LENGTH)
		.replace(/\</g, '&lt;')
		.replace(/\>/g, '&gt;')
		.replace(/[\r\n]+/g, ' ');

	text = badwords.filter(text);

	const user = getUserData(token);

	const message = {
		id: uuid(),
		time: Date.now(),
		text,
		name: user.name,
		area: user.area,
	};

	spam({
		event: 'chatMessage',
		payload: message,
	});

	insert('chat', {
		time: message.time,
		id: message.id,
		name: message.name,
		area: message.area,
		token,
		text,
	});
};

const getMessages = async (count) => {
	if (updated || count) {
		updated = false;
		cache = await asyncQuery('SELECT * FROM (SELECT * FROM chat ORDER BY time DESC LIMIT 0, ?) ORDER BY time ASC', count || LIST_LENGTH);
	}

	return cache;
};

const updateMessage = (id, text) => {
	db.run('UPDATE chat SET text = ? WHERE id = ?', text, id);
	updated = true;
};

const deleteMessage = (id) => {
	db.run('DELETE FROM chat WHERE id=?', id);
	updated = true;
};

module.exports = {
	addMessage,
	getMessages,
	updateMessage,
	deleteMessage,
	addSystemMessage,
};
