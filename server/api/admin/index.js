const { getStats } = require('../../utils/stats');
const { parseCookies } = require('../../helpers');
const { checkSession } = require('../../utils/sessions');
const { checkIsAdmin } = require('../../utils/auth');
const { stats } = require('./stats');
const { streamSettings } = require('./streamSettings');
const { updateFreezedFrame } = require('./updateFreezedFrame');
const { fillSquare } = require('./fillSquare');
const { onlineList } = require('./onlineList');
const { pixel } = require('./pixel');
const { ban } = require('./ban');
const { unban } = require('./unban');
const { getBans } = require('./getBans');
const {
	heatmap,
	newestmap,
	newestmapByIndex,
	usersmap,
	lastPixels,
	byIP,
	byTime,
} = require('./maps');
const { chat } = require('./chat');
const { countdown } = require('./countdown');
const { user } = require('./user');

const getHistory = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getStats().history));
};

let routes = {
	'stats': stats,
	'streamSettings': streamSettings,
	'updateFreezedFrame': updateFreezedFrame,
	'fillSquare': fillSquare,
	'onlineList': onlineList,
	'pixel': pixel,
	'ban': ban,
	'unban': unban,
	'getBans': getBans,
	'heatmap.png': heatmap,
	'newestmap.png': newestmap,
	'newestmapByIndex.png': newestmapByIndex,
	'usersmap.png': usersmap,
	'lastPixels.png': lastPixels,
	'byIP.png': byIP,
	'byTime.png': byTime,
	'history': getHistory,
	'chat': chat,
	'countdown': countdown,
	'user': user,
};

routes = Object.entries(routes).reduce((list, [key, callback]) => ({
	...list,
	[`/admin/${key}`]: callback,
}), {});

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

	if (routes[reqUrl]) {
		routes[reqUrl](req, res);

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end('{}');
};

module.exports = index;
