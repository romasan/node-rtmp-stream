/**
 * сохраняет карту последних пикселей json
 */

const fs = require('fs');
const readline = require('readline');

let uuidsCache = {};

const updateStats = (stats, [time, nick, x, y, _color, _uuid]) => {
	const key = `${x}:${y}`;

	// if (!stats.starttime) {
	// 	stats.starttime = time;
	// }

	stats.lastActivity = {
		time,
		uuid: _uuid,
		x,
		y,
		color: _color,
	};

	let uuid = uuidsCache[_uuid];

	console.log('==== updateStats', {
		time,
		nick,
		x,
		y,
		_color,
		_uuid,
		uuid,
		uuidsCache,
	});

	if (typeof uuid === 'undefined') {
		stats.uuids.push(_uuid);
		uuid = stats.uuids.length - 1;
		uuidsCache[_uuid] = stats.uuids.length - 1;
	}

	let color = stats.colors.indexOf(_color);
	if (color < 0) {
		stats.colors.push(_color);
		color = stats.colors.length - 1;
	}

	const [
		currentTime,
		currentUuid,
		currentColor,
		// prevColorUuid,
		// prevColorColor,
		// prevUserUuid,
		// prevUserColor,
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
		uuid,
		color,
		// ...prevColor,
		// ...prevUser,
		(count || 0) + 1,
	];
	stats.totalCount = (stats.totalCount || 0) + 1;

	if (typeof uuid === 'number') {
		// uuid -> nick
		stats.leaderboard[uuid] = (stats?.leaderboard?.[uuid] || 0) + 1;
	}
}

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

		uuidsCache = stats?.uuids
			? stats.uuids.reduce((list, item, index) => ({ ...list, [item]: index }), {})
			: {};

		let index = 0;

		let _time = Date.now();
	
		rl.on('line', (line) => {
			index++;

			// if (index % 10000 === 0) {
			// 	console.log(
			// 		'====',
			// 		index,
			// 		Date.now() - _time,
			// 		stats.uuids.length,
			// 	);
			// 	_time = Date.now();
			// }

			if (stats.totalCount >= index) {
				return;
			}

			const [time, nick, x, y, color, uuid] = line.split(';');

			updateStats(stats, [time, nick, x, y, color, uuid]);
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
