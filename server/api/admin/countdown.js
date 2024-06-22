const { getPostPayload } = require('../../helpers');
const { getCountdownRanges, updateCountdownRanges } = require('../../utils/countdown');

const countdown = async (req, res) => {
	if (req.method === 'PATCH') {
		const payload = await getPostPayload(req, 'json');

		updateCountdownRanges(payload);

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getCountdownRanges()));
};

module.exports = {
	countdown,
};
