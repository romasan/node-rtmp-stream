const { getPostPayload } = require('../../helpers');
const { unban: unbanTool } = require('../../utils/bans');

const unban = async (req, res) => {
	if (req.method === 'PATCH') {
		const payload = await getPostPayload(req, 'json');
		const { type, value } = payload;

		unbanTool(type, value);

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');};

module.exports = {
	unban,
};
