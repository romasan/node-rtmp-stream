import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { getPostPayload } from '../../helpers';
import {
	addSystemMessage,
	getMessages,
	updateMessage,
	deleteMessage,
	deleteMessagesByNick,
} from '../../utils/chat';

export const chat = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'POST') {
		const { text } = await getPostPayload(req, 'json') as any;

		addSystemMessage(text);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	if (req.method === 'PATCH') {
		const { id, text } = await getPostPayload(req, 'json') as any;

		updateMessage(id, text);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	if (req.method === 'DELETE') {
		const { id, nick } = await getPostPayload(req, 'json') as any;

		if (nick) {
			deleteMessagesByNick(nick);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');

			return;
		}

		deleteMessage(id);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	const query = url.parse(req.url as string, true).query;
	const messages = await getMessages(Number(query.count || 0));

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(messages));
};
