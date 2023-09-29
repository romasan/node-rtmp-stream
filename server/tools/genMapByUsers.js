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

module.exports = genMapByUsers;
