const { createCanvas, Image } = require('canvas');
const fs = require('fs');
const readline = require('readline');

const WIDTH = 426;//854;
const HEIGHT = 240;//480;

const COLORS = [
	'#e2d747',
	'#a5dd5f',
	'#56ba37',
	'#5fcfdb',
	'#3681c1',
	'#091de0',
	'#c276de',
	'#77197c',
	'#e4e4e4',
	'#888888',
	'#f1aacf',
	'#d22d1f',
	'#db9834',
	'#976c49',
];

const drawDefaultCanvas = (file) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);
	
	// const inc = 1;
	// for (let x = 0; x < WIDTH / inc; x++) {
	//   for (let y = 0; y < HEIGHT / inc; y++) {
	//     const color = COLORS[Math.floor((Math.random() * COLORS.length))];
	//     ctx.fillStyle = color;
	//     ctx.fillRect(x * inc, y * inc, inc, inc);
	//   }
	// }

	const squareSize = 40;
	const rows = Math.ceil(HEIGHT / squareSize);
	const cols = Math.ceil(WIDTH / squareSize);
	ctx.strokeStyle = '#0000ff';
	for (let x = 0; x < cols; x++) {
		for (let y = 0; y < rows; y++) {
			if ((x + y) % 2 === 0) {
				ctx.fillStyle = '#ff00ff';
				ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
			}
			ctx.fillStyle = '#008000';
			ctx.fillRect(x * squareSize, y * squareSize, 1, 1);
			ctx.fillStyle = '#0000ff';
			ctx.fillText(`${y + 1}:${x + 1}`, x * squareSize + 5, y * squareSize + 15);
		}
	}
	
	fs.writeFileSync(file, canvas.toBuffer());
}

const upscale = (input, ouptut, scale) => {
	const imgBuf = fs.readFileSync(input);
	const image = new Image;
	image.src = imgBuf;

	const canvas = createCanvas(image.width * scale, image.height * scale);
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);

	fs.writeFileSync(ouptut, canvas.toBuffer());
}

const drawDiffMask = (file, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		const [,,x,y,color] = line.split(';');

		ctx.fillStyle = '#00000033';
		ctx.fillRect(x, y, 1, 1);
	});

	rl.on('close', () => {
		fs.writeFileSync(output, canvas.toBuffer());
	});
};

// upscale('inout.png', 'upscaled.png', 3);

// drawDefaultCanvas('inout.png');

// drawDefaultCanvas('head2.png');
// drawDefaultCanvas('head3.png');
// drawDefaultCanvas('head4.png');
// drawDefaultCanvas('head5.png');
// drawDefaultCanvas('head6.png');

drawDiffMask('./pixels.log.txt', './output.png');
