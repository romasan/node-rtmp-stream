import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuid } from 'uuid';
import { parseCookies, getPostPayload } from '../helpers';
import { getUserData } from '../utils/auth';
import { checkBan } from '../utils/bans';
import { addMessage } from '../utils/chat';
import { Log } from '../utils/log';
import { getValue } from '../utils/values';
import { send } from '../utils/ws';

const DEFAUL_COOLDOWN = 5_000;

const cache: any = {};

export const chat = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req) as string;

		const user: any = getUserData(token);

		if (checkBan({ nick: user?.name, mute: true })) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: failed add message (banned/muted user)', token);

			return;
		}

		const cd = getValue('cooldown');

		if (
			cache[token] &&
			(Date.now() - cache[token].time) < (typeof cd === 'number' ? cd : DEFAUL_COOLDOWN)
		) {
			cache[token].time = Date.now();

			res.writeHead(429, { 'Content-Type': 'text/plain' });
			res.end('fail');

			send(token, 'chatMessage', {
				id: uuid(),
				time: Date.now(),
				text: 'слишком частые сообщения',
				name: 'Bot',
				area: 'system',
			});

			Log('Error: failed add message (cooldown)', token);

			return;
		}

		if (
			cache[token] &&
			cache[token].text === postPayload.slice(0, 100)
		) {
			cache[token].time = Date.now();

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			send(token, 'chatMessage', {
				id: uuid(),
				time: Date.now(),
				text: 'сообщение удалено из-за спама',
				name: 'Bot',
				area: 'system',
			});

			Log('Error: failed add message (duplicate messages)', token);

			return;
		}

		cache[token] = {
			time: Date.now(),
			text: postPayload.slice(0, 100),
		}

		if (typeof postPayload === 'string') {
			addMessage(token, postPayload);

			Log('Chat new message:', postPayload);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
		} else {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');
		}
	} else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');
	}
};
