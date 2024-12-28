import { IncomingMessage, ServerResponse } from 'http';
import { getBans as getBansTool } from '../../utils/bans';

export const getBans = (req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getBansTool()));
};
