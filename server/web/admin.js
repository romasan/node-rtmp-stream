const fs = require('fs');
const {
	getCanvasConf,
	updateCanvasConf,
	updateFreezedFrame,
	drawPix,
	getLastActivity,
	getStats,
	getTotalPixels, getPixelAuthor, getPixelColor,
} = require('../canvas');
const {
	getPostPayload,
	parseCookies, getSearch, getPathByToken,
} = require('./helpers');
const {
	checkSession,
	getSessionUserName,
} = require('../sessions');
const {
	checkIsAdmin,
	getUserData,
} = require('../auth');
const {
	heatmapFromStats,
	mapByUsersFromStats,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
} = require('../tools');
const {
	ban,
	unban,
	getBans,
} = require('./bans');

const startTime = Date.now();

const admin = async (req, res, {
	getInfo,
	getOnlineCountRaw,
	getOnlineCount,
	getOnlineCountList,
}) => {
	const { token } = parseCookies(req.headers.cookie || '');

	if (
		!checkSession(token) ||
		!checkIsAdmin(token)
	) {
		getInfo(req, res);

		return;
	}
	const payloadRaw = ['POST', 'PUT', 'PATCH'].includes(req.method) && (await getPostPayload(req));

	let payload = {};

	try {
		payload = JSON.parse(payloadRaw);
	} catch (error) {/* */}

	const location = req.url.split(/(\/qq\/)|(\?)/);
	const command = location[3];
	const query = location[6]
		?.split('&')
		.map((item) => item.split('='))
		.reduce((list, [key, value]) => ({ ...list, [key]: value }), {}) || {};

	switch (command) {
	case 'stats':
		const [open, all, countByActivity] = getOnlineCountRaw();
		const uniq = getOnlineCount();
		const lastActivity = getLastActivity();
		const user = getUserData(lastActivity?.uuid);
		const total = getTotalPixels();

		const stats = {
			online: {
				uniq,
				open,
				all,
				countByActivity,
			},
			lastActivity: Date.now() - lastActivity?.time,
			lastUserName: user?.name || getSessionUserName(lastActivity?.uuid),
			lastUserUUID: lastActivity.uuid,
			coord: {
				x: lastActivity.x,
				y: lastActivity.y,
			},
			color: lastActivity.color,
			total,
			uptime: Date.now() - startTime,
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
	case 'heatmap.png':
		const heatmapCanvas = await heatmapFromStats(getStats());

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(heatmapCanvas.toBuffer());
		return;
	case 'newestmap.png':
		const newestCanvas = await heatmapNewestFromStats(getStats());

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(newestCanvas.toBuffer());
		return;
	case 'usersmap.png':
		const usersCanvas = await mapByUsersFromStats(getStats());

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(usersCanvas.toBuffer());
		return;
	case 'lastPixels.png':
		const lastPixelsCanvas = await mapLastPixelsFromStats(getStats(), query.count);

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(lastPixelsCanvas.toBuffer());
		return;
	case 'fillSquare':
		if (req.method === 'PUT') {
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
		return;
	case 'onlineList':
		const list = getOnlineCountList().map((item) => {
			const user = getUserData(item?.uuid);

			return {
				...item,
				name: user?.name || getSessionUserName(item.uuid),
			};
		});
		res.writeHead(200, { 'Content-Type': 'text/json' });
		res.end(JSON.stringify(list));
		return;
	case 'pixel':
		const { x, y } = getSearch(req.url);
		const { uuid, time } = getPixelAuthor(x, y);
		const pixelUser = getUserData(uuid);
		const name = pixelUser?.name || getSessionUserName(uuid);

		const errors = [];

		const filePath = getPathByToken(uuid, false);
		let table = [];

		if (fs.existsSync(filePath)) {
			const file = fs.readFileSync(filePath).toString();

			table = file
				.split('\n')
				.filter(Boolean)
				.map((line) => line.split(';'));
		} else {
			errors.push(`Error read file: ${filePath}`);
		}

		const _payload = {
			x,
			y,
			uuid,
			time,
			color: getPixelColor(x, y),
			name,
			user: pixelUser,
			logins: table,
		};

		if (errors.length) {
			_payload.errors = errors;
		}

		res.writeHead(200, { 'Content-Type': 'text/json' });
		res.end(JSON.stringify(_payload));

		return;
	case 'getBans':
		res.writeHead(200, { 'Content-Type': 'text/json' });
		res.end(JSON.stringify(getBans()));

		return;
	case 'ban':
		if (req.method === 'PUT') {
			const { type, value, time } = payload;

			ban(type, value, time && (Date.now() + time));

			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');

			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		return;
	case 'unban':
		if (req.method === 'PATCH') {
			const { type, value } = payload;

			unban(type, value);

			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('ok');

			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('fail');

		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end('{}');
};

module.exports = admin;
