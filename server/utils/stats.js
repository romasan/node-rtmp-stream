/**
 * генерирует статистику поставленных пикселей
 */

const fs = require('fs');
const readline = require('readline');
const { getAuthID } = require('../utils/auth');

let uuidsCache = {};
let ipsCache = {};

const uniqSessions = new Set();

let inited = false;

const formatDate = (date, format) => {
	const _date = new Date(Number(date));

	let [hour, day, month, year] = ['getHours', 'getDate', 'getMonth', 'getFullYear']
		.map((key) => _date[key]());

	month += 1;

	return format
		.replace('yyyy', year)
		.replace('MM', String(month).padStart(2, '0'))
		.replace('dd', String(day).padStart(2, '0'))
		.replace('hh', String(hour).padStart(2, '0'));
};

const updateStats = (stats, [time, area, x, y, color, uuid, ip, nickname]) => {
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
		const _id = getAuthID(uuid) || uuid;

		stats.leaderboard[_id] = (stats?.leaderboard?.[_id] || 0) + 1;
	}

	const date = formatDate(time, 'yyyy-MM-dd-hh');
	const day = date.slice(0, -3);
	const hour = date.slice(-2);

	if (!stats.history.firstDay) {
		stats.history.firstDay = day;
	}

	if (!stats.history.days[day]) {
		stats.history.days[day] = {
			totalPixels: 0,
			pixByHours: {},
			uniqSessions: 0,
		};
	}

	stats.history.days[day].totalPixels = stats.history.days[day].totalPixels + 1;
	stats.history.days[day].pixByHours[hour] = (stats.history.days[day].pixByHours[hour] || 0) + 1;

	uniqSessions.add(uuid);

	stats.history.days[stats.history.lastDay || day].uniqSessions = uniqSessions.size;

	if (stats.history.lastDay && stats.history.lastDay !== day) {
		uniqSessions.clear();
	}

	stats.history.lastDay = day;
};

const getPixelsInfo = (output) => {
	return new Promise((resolve) => {

		const rl = readline.createInterface({
			input: fs.createReadStream(__dirname + '/../../db/pixels.log'),
			crlfDelay: Infinity
		});

		const stats = {}; // require(__dirname + '/../stats.json');

		stats.history = {
			days: {},
			firstDay: '',
			lastDay: '',
		};

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

			const [time, area, x, y, color, uuid, ip, nickname] = line.split(';');

			updateStats(stats, [
				time,
				area,
				x,
				y,
				color,
				uuid,
				ip,
				nickname,
			]);
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
