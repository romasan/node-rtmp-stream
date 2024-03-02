/**
 * сохраняет карту последних пикселей json
 */

const fs = require('fs');
const readline = require('readline');
const { getAuthId } = require('../utils/auth');

let uuidsCache = {};
let ipsCache = {};

const updateStats = (stats, [time, nick, x, y, color, uuid, ip]) => {
	const key = `${x}:${y}`;

	// if (!stats.starttime) {
	// 	stats.starttime = time;
	// }

	stats.lastActivity = {
		time,
		uuid,
		x,
		y,
		color,
		ip,
	};

	let uuidIndex = uuidsCache[uuid];

	if (typeof uuidIndex === 'undefined') {
		stats.uuids.push(uuid);
		uuidIndex = stats.uuids.length - 1;
		uuidsCache[uuid] = stats.uuids.length - 1;
	}


	let colorIndex = stats.colors.indexOf(color);

	if (colorIndex < 0) {
		stats.colors.push(color);
		colorIndex = stats.colors.length - 1;
	}

	let ipIndex = ipsCache[ip];

	if (typeof ipIndex === 'undefined') {
		stats.ips.push(ip);
		ipIndex = stats.ips.length - 1;
		ipsCache[ip] = stats.ips.length - 1;
	}

	const [
		/* currentTime */,
		/* currentUuid */,
		/* currentColor */,
		count,
	] = stats[key] || [];

	// const prevUser = prevUserUuid === currentUuid
	// 	? [prevUserUuid, prevUserColor]
	// 	: [currentUuid, currentColor];
	// const prevColor = prevColorColor === currentColor
	// 	? [prevColorUuid, prevColorColor]
	// 	: [currentUuid, currentColor];

	stats[key] = [
		time,
		uuidIndex,
		colorIndex,
		(count || 0) + 1,
		ipIndex,
	];
	stats.totalCount = (stats.totalCount || 0) + 1;

	if (typeof uuidIndex === 'number') {
		const _id = getAuthId(uuid) || uuid;

		stats.leaderboard[_id] = (stats?.leaderboard?.[_id] || 0) + 1;
	}
};

let inited = false;

const getPixelsInfo = (output) => {
	return new Promise((resolve) => {

		const rl = readline.createInterface({
			input: fs.createReadStream(__dirname + '/../../db/pixels.log'),
			crlfDelay: Infinity
		});

		const stats = {}; // require(__dirname + '/../stats.json');

		if (!stats.leaderboard) {
			stats.leaderboard = {};
		}

		if (!stats.uuids) {
			stats.uuids = [];
		}

		if (!stats.colors) {
			stats.colors = [];
		}

		if (!stats.ips) {
			stats.ips = [];
		}

		uuidsCache = stats?.uuids
			? stats.uuids.reduce((list, item, index) => ({ ...list, [item]: index }), {})
			: {};

		let index = 0;
	
		rl.on('line', (line) => {
			index++;

			if (stats.totalCount >= index) {
				return;
			}

			const [time, nick, x, y, color, uuid, ip] = line.split(';');

			updateStats(stats, [time, nick, x, y, color, uuid, ip]);
		});
	
		rl.on('close', () => {
			// fs.writeFileSync(__dirname + '/../stats.json', JSON.stringify(stats));
			if (output) {
				fs.writeFileSync(output, JSON.stringify(stats));
			}
			inited = true;
			resolve(stats);
		});
	});
};

const getStatus = () => {
	return inited;
};

module.exports = {
	getPixelsInfo,
	updateStats,
	getStatus,
};
