/**
 * генерирует статистику поставленных пикселей
 */

const fs = require('fs');
const readline = require('readline');
const { getAuthID } = require('./auth');
const { formatDate } = require('../helpers/formatDate');
const { Log } = require('./log');

let stats = {};
let inited = false;
let uuidsCache = {};
let ipsCache = {};
const uniqSessions = new Set();
const SEC = 1000;
const MIN = SEC * 60;
const HOUR = MIN * 60;

const updateStats = ([time, area, x, y, color, uuid, ip, nickname]) => {
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

	const date = formatDate(time, 'YYYY-MM-DD-hh');
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

	if (Date.now() - time > HOUR) {
		return;
	}

	const _min = time - MIN;
	const _2min = time - MIN * 2;
	const _hour = time - HOUR;
	const _2hour = time - HOUR * 1.1;

	stats.history.min.push(time);
	stats.history.hour.push(time);

	if (stats.history.min.length > 1_000 && stats.history.min[0] >= _2min) {
		stats.history.min = stats.history.min.filter((t) => t >= _min);
	}

	if (stats.history.hour.length > 10_000 && stats.history.hour[0] >= _2hour) {
		stats.history.hour = stats.history.hour.filter((t) => t >= _hour);
	}
};

const getPixelsInfo = (output) => {
	return new Promise((resolve) => {

		const rl = readline.createInterface({
			input: fs.createReadStream(__dirname + '/../../db/pixels.log'),
			crlfDelay: Infinity
		});

		if (!stats.history) {
			stats.history = {
				days: {},
				firstDay: '',
				lastDay: '',
				min: [],
				hour: [],
			};
		}

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

			updateStats([
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

const initStats = async () => {
	Log('Init stats...');

	const _start = Date.now();

	stats = await getPixelsInfo();

	Log(`Stats inited at ${Number(((Date.now() - _start) / 1000).toFixed(1))}s.\n`);
};

const getStats = () => stats;

const getPixelAuthor = (x, y) => {
	const key = `${x}:${y}`;
	const [
		currentTime,
		currentUuid,
		// currentColor,
		// prevColorUuid,
		// prevColorColor,
		// prevUserUuid,
		// prevUserColor,
		// count,
	] = stats?.[key] || [];

	return {
		uuid: stats?.uuids?.[currentUuid],
		time: currentTime,
	};
};

const getPixelAuthorIPAddress = (x, y) => {
	const key = `${x}:${y}`;
	const [
		/* currentTime */,
		/* currentUuid */,
		/* currentColor */,
		/* count */,
		ip,
	] = stats?.[key] || [];

	return stats?.ips[ip];
};

const getPixelColor = (x, y) => {
	const key = `${x}:${y}`;
	const [
		,// currentTime,
		,// currentUuid,
		currentColor,
		// prevColorUuid,
		// prevColorColor,
		// prevUserUuid,
		// prevUserColor,
		// count,
	] = stats?.[key] || [];

	return stats?.colors?.[currentColor];
};

const getTotalPixels = () => {
	return stats?.totalCount || 0;
};

const getTopLeaderboard = (count = 10, uuid) => {
	const sorted = Object.entries(stats?.leaderboard || {})
		.sort(([, a], [, b]) => a < b ? 1 : -1);
	const output = sorted
		.slice(0, count)
		.reduce((list, [id, value], index) => [
			...list,
			{
				id,
				count: value,
				place: index + 1,
			},
		], []);

	if (uuid && !output.some((item) => item.uuid === uuid)) {
		const place = sorted.findIndex(([id]) => id === (getAuthID(uuid) || uuid));

		if (place >= output.length) {
			output.push({
				id: uuid,
				count: sorted[place][1],
				place: place + 1,
			});
		}
	}

	return output;
};

const getLastActivity = () => {
	const _min = Date.now() - MIN;
	const _hour = Date.now() - HOUR;

	return {
		lastActivity: stats?.lastActivity || 0,
		perMin: stats.history.min.filter((t) => t >= _min).length,
		perHour: stats.history.hour.filter((t) => t >= _hour).length,
	};
};

module.exports = {
	getPixelsInfo,
	updateStats,
	getStatus,
	initStats,
	getStats,
	getPixelColor,
	getPixelAuthor,
	getTotalPixels,
	getTopLeaderboard,
	getLastActivity,
	getPixelAuthorIPAddress,
};
