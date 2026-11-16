import { IncomingMessage } from 'http';

const { server: { proxyIp } } = require('../config.json');

export const getIPAddress = (req: IncomingMessage) => {
	if (proxyIp) {
		return req.headers['x-forwarded-for'] as string;
	}

	return req.socket.remoteAddress;
};
