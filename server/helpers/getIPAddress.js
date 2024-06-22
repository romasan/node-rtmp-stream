const { server: { proxyIp } } = require('../config.json');

const getIPAddress = (req) => {
	if (proxyIp) {
		return req.headers['x-forwarded-for'];
	}

	return req.socket.remoteAddress;
};

module.exports = {
	getIPAddress,
};
