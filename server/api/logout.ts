import { IncomingMessage, ServerResponse } from 'http';
import { parseCookies } from '../helpers';
import { removeUser } from '../utils/auth';

const { server: { host } } = require('../config.json');

export const logout = (req: IncomingMessage, res: ServerResponse) => {
	const { token } = parseCookies(req.headers.cookie);

	removeUser(token);

	res.setHeader('Set-Cookie', 'token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/');
	res.writeHead(302, { Location: host });
	res.end();
};
