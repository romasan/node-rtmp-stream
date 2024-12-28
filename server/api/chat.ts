import { IncomingMessage, ServerResponse } from 'http';
import { parseCookies, getPostPayload } from '../helpers';
import { getUserData } from '../utils/auth';
import { checkBan } from '../utils/bans';
import { addMessage } from '../utils/chat';
import { Log } from '../utils/log';

export const chat = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		const { token } = parseCookies(req.headers.cookie);
		const postPayload = await getPostPayload(req);

		const user: any = getUserData(token);

		if (checkBan({ nick: user?.name, mute: true })) {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: failed add message (banned/muted user)', token);

			return;
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
