const { parseCookies } = require('../helpers');
const { removeUser } = require('../utils/auth');
const { server: { host } } = require('../config.json');

const logout = (req, res) => {
	const { token } = parseCookies(req.headers.cookie);

	removeUser(token);

	res.writeHead(302, { Location: host });
	res.end();
};

module.exports = {
	logout,
};
