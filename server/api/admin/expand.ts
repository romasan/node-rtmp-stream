import { IncomingMessage, ServerResponse } from 'http';
import { getPostPayload } from '../../helpers';
import { expand as setExpand, getExpand } from '../../utils/expands';
import { expandCanvas } from '../../utils/canvas';
import { spam } from '../../utils/ws';

export const expand = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		const payload: any = await getPostPayload(req, 'json');
		const { width, height, shiftX, shiftY, colorScheme } = payload;
		const expand = getExpand();

		expandCanvas(width, height, shiftX - expand.shiftX, shiftY - expand.shiftY);
		setExpand(width, height, shiftX, shiftY, colorScheme);
		spam({
			event: 'expand',
			payload: getExpand(),
		});

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getExpand()));
};
