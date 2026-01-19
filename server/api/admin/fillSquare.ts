import { IncomingMessage, ServerResponse } from 'http';
import {
	drawPix,
	Log,
	getToken,
} from '../../utils';
import { getPostPayload } from '../../helpers';

export const fillSquare = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		const token = getToken(req);
		const payload: any = await getPostPayload(req, 'json');

		try {
			const { from, to, color } = payload;
			const [startX, endX] = from.x < to.x ? [from.x, to.x] : [to.x, from.x];
			const [startY, endY] = from.y < to.y ? [from.y, to.y] : [to.y, from.y];

			for (let x = startX; x < endX; x++) {
				for (let y = startY; y < endY; y++) {
					drawPix({
						color: color,
						x: Math.floor(x),
						y: Math.floor(y),
						nickname: 'Admin',
						area: '',
						uuid: token,
					});
				}
			}

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
			return;
		} catch (error) {
			Log('Error: fill square failed.', error);
		}
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');
};
