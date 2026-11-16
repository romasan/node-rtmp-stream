import { IncomingMessage, ServerResponse } from 'http';
import { removeUser, getToken } from '../utils';

const { server: { host } } = require('../config.json');

export const logout = (req: IncomingMessage, res: ServerResponse) => {
	const token = getToken(req);

	removeUser(token);

	res.setHeader('Set-Cookie', 'token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/');
	res.writeHead(302, { Location: host });
	res.end();
};
