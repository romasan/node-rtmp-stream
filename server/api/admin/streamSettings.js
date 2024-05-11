const { updateCanvasConf, getCanvasConf } = require('../../utils/canvas');
const { getPostPayload } = require('../../helpers');

const streamSettings = async (req, res) => {
	if (req.method === 'PATCH') {
		const payload = await getPostPayload(req, 'json');

		if (typeof payload.freezed !== 'undefined' && typeof payload.withBg !== 'undefined') {
			updateCanvasConf(payload);

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');

			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');
	} else {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(getCanvasConf()));
	}
};

module.exports = {
	streamSettings,
};
