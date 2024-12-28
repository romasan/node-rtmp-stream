import { IncomingMessage, ServerResponse } from 'http';
import { getPostPayload } from '../../helpers';
import { getCountdownRanges, updateCountdownRanges } from '../../utils/countdown';

export const countdown = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PATCH') {
		const payload = await getPostPayload(req, 'json');

		updateCountdownRanges(payload);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getCountdownRanges()));
};
