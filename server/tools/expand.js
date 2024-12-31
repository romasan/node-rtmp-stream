const fs = require('fs');
const { createCanvas, Image } = require('canvas');

export const getFileLinesCount = (file) => new Promise((resolve) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	let count = 0;

	rl.on('line', () => {
		count++;
	});

	rl.on('close', () => {
		resolve(count);
	});
});

const expand = async (input, output, width, height, shiftX = 0, shiftY = 0) => {
	const countOfPixels = await getFileLinesCount(__dirname + '/../../db/pixels.log');

	const file = fs.createWriteStream(__dirname + '/../../db/expands.log', { flags : 'a' });

	const imgBuf = fs.readFileSync(input);
	const image = new Image;
	image.src = imgBuf;

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);

	ctx.drawImage(image, shiftX, shiftY);

	fs.writeFileSync(output, canvas.toBuffer());

	file.write([
		Date.now(),
		countOfPixels,
		width,
		height,
		shiftX,
		shiftY,
	].join(';') + '\n');
	file.close();
};

module.exports = expand;
