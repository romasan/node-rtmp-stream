const url = require('url');
const { getStats } = require('../../utils/canvas');
const { parseCookies } = require('../../helpers');
const { checkSession } = require('../../utils/sessions');
const { checkIsAdmin } = require('../../utils/auth');
const {
	heatmapFromStats,
	mapByUsersFromStats,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
} = require('../../tools');
const { stats } = require('./stats');
const { streamSettings } = require('./streamSettings');
const { updateFreezedFrame } = require('./updateFreezedFrame');
const { fillSquare } = require('./fillSquare');
const { onlineList } = require('./onlineList');
const { pixel } = require('./pixel');
const { ban } = require('./ban');
const { unban } = require('./unban');
const { getBans } = require('./getBans');

const routes = {
	'/admin/stats': stats,
	'/admin/streamSettings': streamSettings,
	'/admin/updateFreezedFrame': updateFreezedFrame,
	'/admin/fillSquare': fillSquare,
	'/admin/onlineList': onlineList,
	'/admin/pixel': pixel,
	'/admin/ban': ban,
	'/admin/unban': unban,
	'/admin/getBans': getBans,
};

const index = async (req, res, {
	getInfo,
}) => {
	const { token } = parseCookies(req.headers.cookie || '');

	if (
		!checkSession(token) ||
		!checkIsAdmin(token)
	) {
		getInfo(req, res);

		return;
	}

	const reqUrl = req.url.split('?')[0];
	const query = url.parse(req.url, true).query;

	if (routes[reqUrl]) {
		routes[reqUrl](req, res);

		return;
	}

	switch (reqUrl) {
	case '/admin/heatmap.png':
		const heatmapCanvas = await heatmapFromStats(getStats());

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(heatmapCanvas.toBuffer());
		return;
	case '/admin/newestmap.png':
		const newestCanvas = await heatmapNewestFromStats(getStats());

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(newestCanvas.toBuffer());
		return;
	case '/admin/usersmap.png':
		const usersCanvas = await mapByUsersFromStats(getStats());

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(usersCanvas.toBuffer());
		return;
	case '/admin/lastPixels.png':
		const lastPixelsCanvas = await mapLastPixelsFromStats(getStats(), query.count);

		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(lastPixelsCanvas.toBuffer());
		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/json' });
	res.end('{}');
};

module.exports = index;
