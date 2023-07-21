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

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const checkLog = (file, input, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	const imgBuf = fs.readFileSync(input);
	const image = new Image;
	image.src = imgBuf;

	ctx.drawImage(image, 0, 0);

	// const breakTime = 1689268190114 - (1000 * 60 * 60);
	const breakTime = 1689695462221 - 5 * min - 15 * sec;
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
		const [time,,x,y,color] = line.split(';');

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

const recover = (file, backgroundImage, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	const imgBuf = fs.readFileSync(backgroundImage);
	const image = new Image;
	image.src = imgBuf;

	ctx.drawImage(image, 0, 0);

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		const [,,x,y,color] = line.split(';');

		ctx.fillStyle = color;
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

drawDiffMask('./pixels.log', './output.png');
// checkLog('./pixels.log', '426x240.png', './output.png');
// recover('./pixels.log2', './426x240.png', './output.png');
