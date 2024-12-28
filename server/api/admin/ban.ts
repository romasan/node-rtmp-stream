import { IncomingMessage, ServerResponse } from 'http';
import { getPostPayload } from '../../helpers';
import { ban as banTool } from '../../utils/bans';

export const ban = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		const payload: any = await getPostPayload(req, 'json');
		const { type, value, time } = payload;

		banTool(type, value, time && (Date.now() + time));

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');
};
