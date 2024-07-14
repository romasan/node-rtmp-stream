const { getOnlineCountRaw, getOnlineCount } = require('../../utils/ws');
const { getLastActivity, getTotalPixels } = require('../../utils/stats');
const { getUserData } = require('../../utils/auth');
const { getSessionUserName } = require('../../utils/sessions');

const startTime = Date.now();

const stats = (req, res) => {
	const [open, all, countByActivity] = getOnlineCountRaw();
	const uniq = getOnlineCount();
	const {
		lastActivity,
		perMin,
		perHour,
	} = getLastActivity();
	const user = getUserData(lastActivity?.uuid);
	const total = getTotalPixels();

	const payload = {
		online: {
			uniq,
			open,
			all,
			countByActivity,
		},
		lastActivity: Date.now() - lastActivity?.time,
		perMin,
		perHour,
		lastUserName: user?.name || getSessionUserName(lastActivity?.uuid),
		lastUserUUID: lastActivity.uuid,
		lastUserIP: lastActivity.ip,
		coord: {
			x: lastActivity.x,
			y: lastActivity.y,
		},
		color: lastActivity.color,
		total,
		uptime: Date.now() - startTime,
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};

module.exports = {
	stats,
};
