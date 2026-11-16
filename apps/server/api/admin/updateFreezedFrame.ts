import { IncomingMessage, ServerResponse } from 'http';
import { updateFreezedFrame as updateFreezedFrameTool } from '../../utils/canvas';

export const updateFreezedFrame = (req: IncomingMessage, res: ServerResponse) => {
	updateFreezedFrameTool();

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('ok');
};
