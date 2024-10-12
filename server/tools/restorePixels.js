const fs = require('fs');
const readline = require('readline');
const Progress = require('cli-progress');

const BACKUP_FILES_COUNT = 39;
const restorePixels = (input, output) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});
	const file = fs.createWriteStream(output);
	const bar = new Progress.Bar();
	let list = [];

	bar.start(BACKUP_FILES_COUNT, 0);

	for (let i = 1; i <= BACKUP_FILES_COUNT; i++) {
		const json = JSON.parse(fs.readFileSync(`${__dirname}/../../db/stats/backup-${i}.json`));

		Object.values(json).forEach((item) => {
			const line = [
				item.time,
				item.user.area,
				item.x,
				item.y,
				item.color,
				item.uuid,
				item.ip,
				item.user.name,
			].join(';');

			list.push([Number(item.time), line]);
		});

		bar.update(i);
	}

	list = list.sort(([a], [b]) => a > b ? 1 : -1);

	bar.stop();

	const bar2 = new Progress.Bar();

	bar2.start(list.length, 0);

	let statsSelectedItem = list.shift()[1].split(';');
	let prevLines = [];
	let doublesCount = 0;
	let addedCount = 0;
	let i = 0;

	rl.on('line', (line) => {
		file.write(line + '\n');

		prevLines.push(line);

		if (prevLines.length === 1) {
			return;
		}

		const [time] = line.split(';');

		if (prevLines[0].split(';')[0] === time) {
			return;
		}

		if (time >= statsSelectedItem[0]) {
			const [_time, _x, _y, _color] = statsSelectedItem;
			const isExist = prevLines.some((_line) => {
				const [prev_time, prev_x, prev_y, prev_color] = _line.split(';');

				return prev_time === _time &&
					prev_x === _x &&
					prev_y === _y &&
					prev_color === _color;
			});

			if (isExist) {
				doublesCount++;
			} else {
				bar2.update(++addedCount);
				file.write(statsSelectedItem.join(';') + '\n');
				statsSelectedItem = list.shift()[1].split(';');
			}

			prevLines = [];
		} else {
			prevLines = [line];
		}
	});

	rl.on('close', () => {
		console.log('====', prevLines.length, list.length);

		if (prevLines.length) {
			prevLines.forEach((line) => {
				file.write(line + '\n');
			});
		}

		if (list.length) {
			list.forEach((line) => {
				file.write(line + '\n');
			});
		}

		bar2.stop();

		console.log('done', {
			addedCount,
			doublesCount,
		});
	});
};

const datetimeList = new Set();
let hasDoubles = 0;
const doubles = {};

const checkDTDubles = (input) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity,
	});

	rl.on('line', (line) => {
		// if (hasDoubles) {
		// 	return;
		// }

		const [time] = line.split(';');

		if (datetimeList.has(time)) {
			hasDoubles++;
			doubles[time] = (doubles[time] || 1) + 1;
		}

		datetimeList.add(time);
	});

	rl.on('close', () => {
		console.log('has doubles:', hasDoubles, Object.keys(doubles).length);

		if (hasDoubles) {
			const _keys = Object.entries(doubles)
				.sort(([, a], [, b]) => Number(a) < Number(b) ? 1 : -1)
				.map(([key]) => key);
			fs.writeFileSync(__dirname + '/dtdoubles.json', JSON.stringify(doubles, _keys, 2));
		}
	});
};

module.exports = {
	restorePixels,
	checkDTDubles,
};
