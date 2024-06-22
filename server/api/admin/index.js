const { getStats } = require('../../utils/canvas');
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
	usersmap,
	lastPixels,
} = require('./maps');
const { chat } = require('./chat');
const { countdown } = require('./countdown');

const getHistory = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getStats().history));
};

const prefix = '/admin';

const routes = {
	[`${prefix}/stats`]: stats,
	[`${prefix}/streamSettings`]: streamSettings,
	[`${prefix}/updateFreezedFrame`]: updateFreezedFrame,
	[`${prefix}/fillSquare`]: fillSquare,
	[`${prefix}/onlineList`]: onlineList,
	[`${prefix}/pixel`]: pixel,
	[`${prefix}/ban`]: ban,
	[`${prefix}/unban`]: unban,
	[`${prefix}/getBans`]: getBans,
	[`${prefix}/heatmap.png`]: heatmap,
	[`${prefix}/newestmap.png`]: newestmap,
	[`${prefix}/usersmap.png`]: usersmap,
	[`${prefix}/lastPixels.png`]: lastPixels,
	[`${prefix}/history`]: getHistory,
	[`${prefix}/chat`]: chat,
	[`${prefix}/countdown`]: countdown,
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

	if (routes[reqUrl]) {
		routes[reqUrl](req, res);

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end('{}');
};

module.exports = index;
