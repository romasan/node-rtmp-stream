const url = require('url');
const { getSessionsByNick } = require('../../utils/auth');

const user = (req, res) => {
	const query = url.parse(req.url, true).query;
	const uuids = getSessionsByNick(query.nick);
	const payload = {
		uuids,
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};

module.exports = {
	user,
};
