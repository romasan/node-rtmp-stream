const {
	getCanvasConf,
	updateCanvasConf,
	updateFreezedFrame,
	drawPix,
	getLastActivity,
} = require('../canvas');
const {
	getPostPayload,
	parseCookies,
} = require('./helpers');
const {
	checkSession,
} = require('../sessions');
const {
	checkIsAdmin,
	getUserData,
} = require('../auth');

const admin = async (req, res, {
	getInfo,
	getOnlineCountRaw,
	getOnlineCount,
}) => {
	const { token } = parseCookies(req.headers.cookie || '');

	if (
		checkSession(token) &&
		checkIsAdmin(token)
	) {
		const payloadRaw = ['POST', 'PUT', 'PATCH'].includes(req.method) && (await getPostPayload(req));

		let payload = {};

		try {
			payload = JSON.parse(payloadRaw);
		} catch (error) {}

		const command = req.url.split('/qq/').pop();

		switch (command) {
			case 'stats':
				const [open, all] = getOnlineCountRaw();
				const uniq = getOnlineCount();
				const lastActivity = getLastActivity();
				const user = getUserData(lastActivity?.uuid);
				const stats = {
					online: {
						uniq,
						open,
						all,
					},
					lastActivity: Date.now() - lastActivity?.time,
					lastUserName: user?.name || 'Guest',
					lastUserUUID: lastActivity.uuid,
					coord: {
						x: lastActivity.x,
						y: lastActivity.y,
					},
					color: lastActivity.color,
				};

				res.writeHead(200, { 'Content-Type': 'text/json' });
				res.end(JSON.stringify(stats));
				return;
			case 'streamSettings':
				if (req.method === 'PATCH') {
					updateCanvasConf(payload);
	
					res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.end('ok');
				} else {
					res.writeHead(200, { 'Content-Type': 'text/json' });
					res.end(JSON.stringify(getCanvasConf()));
				}
				return;
			case 'updateFreezedFrame':
				updateFreezedFrame();

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('ok');
				return;
			case 'heatmap':
				// const canvas = getHeatmap();
				// res.writeHead(200, { 'Content-Type': 'image/png' });
				// res.end(canvas.toBuffer());
				return;
			case 'fillSquare':
				if (req.method === 'PUT') {
					const { from, to, color } = payload;
					const [startX, endX] = [from.x, to.x].sort();
					const [startY, endY] = [from.y, to.y].sort();

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
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('fail');

				return;
		}

		res.writeHead(200, { 'Content-Type': 'text/json' });
		res.end('{}');
	} else {
		getInfo(req, res);
	}
};

module.exports = admin;
