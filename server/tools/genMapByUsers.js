/**
 * получает карту пикселей рисует пиксели с уникальным цветом для юзера
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

const {
	WIDTH,
	HEIGHT,
} = require('./constants.json');

const genMapByUsers = (map, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const uuids = {};
	let count = 0;

	for (const key in map) {
		const item = map[key];

		if (!(item.uuid in uuids)) {
			count++;
		}

		// uuids[item.uuid] = (uuids[item.uuid] || 0) + 1;
		uuids[item.uuid] = true;
	}

	const colors = Array(20).fill().map((e, i) => (
		'#' + (
				Math.floor(0xffffff / (20 + 1)) * i
		).toString(16).padStart(6, '0')
	));

	let i = 0;

	for (const index in uuids) {
		uuids[index] = colors[i++];
	}

	for (const key in map) {
		const [x, y] = key.split(':');
		const { uuid } = map[key];
		const color = uuids[uuid];

		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);
	}

	fs.writeFileSync(output, canvas.toBuffer());
};

const mapByUsersFromStats = async (stats, output) => {
	if (typeof stats === 'string') {
		stats = await readJSON(stats)
	}

	let width = 0;
	let height = 0;

	let uuids = {};

	Object.keys(stats).forEach((key) => {
		if (key.indexOf(':') > 0) {
			const [x, y] = key.split(':');
			const [, uuid] = stats[key];
			uuids[uuid] = true;

			width = Math.max(Number(x), width);
			height = Math.max(Number(y), height);
		}
	});

	const canvas = createCanvas(width + 1, height + 1);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width + 1, height + 1);

	const length = Object.keys(uuids).length;
	const colors = Array(length + 1).fill().map((e, i) => (
		'#' + (
				Math.floor(0xffffff / length) * i
		).toString(16).padStart(6, '0')
	));

	colors.shift();

	uuids = Object.keys(uuids).reduce((list, key, index) => ({ ...list, [key]: index }), {});

	for (let x = 0; x <= width; x++) {
		for (let y = 0; y <= height; y++) {
			const key = `${x}:${y}`;
			const [, uuid] = stats[key] || [];
			if (typeof uuid !== 'undefined') {
				ctx.fillStyle = colors[uuids[uuid]];
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	if (output) {
		fs.writeFileSync(output, canvas.toBuffer());
	} else {
		return canvas;
	}
};

module.exports = {
	genMapByUsers,
	mapByUsersFromStats,
};
