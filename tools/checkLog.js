/**
 * сохраняет пиксели с определённого времени
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas, Image } = require('canvas');

const {
	WIDTH,
	HEIGHT,
} = require('./constants.json');

const checkLog = (file, input, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	const imgBuf = fs.readFileSync(input);
	const image = new Image;
	image.src = imgBuf;

	ctx.drawImage(image, 0, 0);

	// const breakTime = 1689268190114 - (1000 * 60 * 60);
	const breakTime = 1691531668859 - 3 * hour - 30 * min;
	// head -127190 pixels.log > pixels.log2
	// tail -615 pixels.log >> pixels.log2
	// 176099-175484=615

	let n = 0;

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		n++;
		const [time, area, x, y, color] = line.split(';');

		if (Number(time) >= breakTime) {
			rl.pause();
			rl.removeAllListeners('line');
			rl.close();
			console.log(`#${n} ${time} => ${breakTime}`);
			return;
		}

		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);
	});

	rl.on('close', () => {
		console.log('EOF');
		fs.writeFileSync(output, canvas.toBuffer());
	});
};

module.exports = checkLog;
