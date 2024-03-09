const { getPostPayload } = require('../../helpers');
const { ban: banTool } = require('../../utils/bans');

const ban = async (req, res) => {
	if (req.method === 'PUT') {
		const payload = await getPostPayload(req, 'json');
		const { type, value, time } = payload;

		banTool(type, value, time && (Date.now() + time));

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');
};

module.exports = {
	ban,
};
