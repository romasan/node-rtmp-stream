import { IncomingMessage, ServerResponse } from 'http';
import { getValue, setValue } from '../../utils/values';
import { spam } from '../../utils/ws';

export const pause = async (req: IncomingMessage, res: ServerResponse) => {
	if (req.method === 'PUT') {
		setValue('paused', true);
		spam({ event: 'pause', payload: true });

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	if (req.method === 'DELETE') {
		setValue('paused', false);
		spam({ event: 'pause', payload: false });

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({
		paused: getValue('paused'),
	}));
};
