/**
 * чат
 */

import { v4 as uuid } from 'uuid';
import { getUserData } from './auth';
import { spam } from '../utils/ws';
import { db, asyncQuery, insert } from '../utils/db';
import BadWordsNext from 'bad-words-next';
import ru from 'bad-words-next/data/ru.json';

const badwords = new BadWordsNext({ data: ru });

const LIST_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

let cache: unknown = [];
let updated = true;

export const addSystemMessage = (text: string) => {
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

export const addMessage = (token: string, text: string) => {
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

	const user: any = getUserData(token);

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

export const getMessages = async (count?: number) => {
	if (updated || count) {
		updated = false;
		cache = await asyncQuery('SELECT * FROM (SELECT * FROM chat ORDER BY time DESC LIMIT 0, ?) ORDER BY time ASC', String(count || LIST_LENGTH));
	}

	return cache;
};

export const updateMessage = (id: string, text: string) => {
	db.run('UPDATE chat SET text = ? WHERE id = ?', text, id);
	updated = true;
};

export const deleteMessage = (id: string) => {
	db.run('DELETE FROM chat WHERE id=?', id);
	updated = true;
};

export const deleteMessagesByNick = (nick: string) => {
	db.run('DELETE FROM chat WHERE name=?', nick);
	updated = true;
};
