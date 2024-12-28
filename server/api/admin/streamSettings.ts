import { IncomingMessage, ServerResponse } from 'http';
import { updateCanvasConf, getCanvasConf } from '../../utils/canvas';
import { getPostPayload } from '../../helpers';

export const streamSettings = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PATCH') {
		const payload: any = await getPostPayload(req, 'json');

		if (typeof payload.freezed !== 'undefined' && typeof payload.withBg !== 'undefined') {
			updateCanvasConf(payload);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');

			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');
	} else {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(getCanvasConf()));
	}
};
