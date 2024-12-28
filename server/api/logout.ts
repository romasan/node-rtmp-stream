import { IncomingMessage, ServerResponse } from 'http';
import { parseCookies } from '../helpers';
import { removeUser } from '../utils/auth';

const { server: { host } } = require('../config.json');

export const logout = (req: IncomingMessage, res: ServerResponse) => {
	const { token } = parseCookies(req.headers.cookie);

	removeUser(token);

	res.writeHead(302, { Location: host });
	res.end();
};
