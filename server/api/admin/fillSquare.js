const { drawPix } = require('../../utils/canvas');
const { getPostPayload, parseCookies } = require('../../helpers');

const fillSquare = async (req, res) => {
	if (req.method === 'PUT') {
		const { token } = parseCookies(req.headers.cookie || '');
		const payload = await getPostPayload(req, 'json');

		try {
			const { from, to, color } = payload;
			const [startX, endX] = from.x < to.x ? [from.x, to.x] : [to.x, from.x];
			const [startY, endY] = from.y < to.y ? [from.y, to.y] : [to.y, from.y];

			for (let x = startX; x < endX; x++) {
				for (let y = startY; y < endY; y++) {
					drawPix({
						color: color,
						x: Math.floor(x),
						y: Math.floor(y),
						nickname: '',
						uuid: token,
					});
				}
			}

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
			return;
		} catch (error) {
			console.log('Error: fill square failed.', error);
		}
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('fail');
};

module.exports = {
	fillSquare,
};
