import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { getSessionsByNick } from '../../utils/auth';

export const user = (req: IncomingMessage, res: ServerResponse) => {
	const query: any = url.parse(req.url as string, true).query;
	const uuids = getSessionsByNick(query.nick);
	const payload = {
		uuids,
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};
