import { IncomingMessage, ServerResponse } from 'http';
import { getPostPayload } from '../../helpers';
import { unban as unbanTool } from '../../utils/bans';

export const unban = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PATCH') {
		const payload: any = await getPostPayload(req, 'json');
		const { type, value } = payload;

		unbanTool(type, value);

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');
};
