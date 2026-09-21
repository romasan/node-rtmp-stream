/**
 * сохраняет лог пикселей тольк определённого юзера
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas } = require('canvas');

const filterByUUID = (input, output, uuid, ago) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time,,,,,_uuid] = line.split(';');

		if (uuid === _uuid) {
			return;
		}

		if (time && (Date.now() - ago) > time) {
			return;
		}

		file.write(line + '\n');
	});
};

const filterAXY = (input, output, ago, aX, aY, bX, bY, width = 1, height = 1, outputImage) => {
	if (!ago) {
		const sec = 1000;
		const min = sec * 60;
		const hour = min * 60;
		const day = hour * 24;

		ago = 2 * day;
		console.log('==== ago:', ago);
	}
	// 6 0 111 7
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, width, height);

	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time,, x, y, color] = line.split(';');

		if (
			time >= (Date.now() - ago) &&
			x >= aX && x <= bX &&
			y >= aY && y <= bY
		) {
			return;
		}

		if (outputImage) {
			ctx.fillStyle = color;
			ctx.fillRect(x, y, 1, 1);
		}

		file.write(line + '\n');
	});

	rl.on('close', () => {
		if (outputImage) {
			fs.writeFileSync(outputImage, canvas.toBuffer());
		}
	});
};

module.exports = {
	filterByUUID,
	filterAXY,
};
