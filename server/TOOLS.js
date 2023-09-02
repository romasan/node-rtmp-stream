const { createCanvas, Image } = require('canvas');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

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
		const [,,x,y,color,uuid] = line.split(';');

		if (uuid !== 'e26ba007-3fcf-4fcc-a8e2-e163ca01b729') {
		// if (uuid === 'c1dc793a-ed45-4ff3-9730-a9fc2710afcc') {
			ctx.fillStyle = color;
			ctx.fillRect(x, y, 1, 1);
		}

		// ctx.fillStyle = '#00000033';
		// ctx.fillRect(x, y, 1, 1);

	});

	rl.on('close', () => {
		fs.writeFileSync(output, canvas.toBuffer());
	});
};

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;

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

const PPF = 50;

const drawSteps = (file, backgroundImage) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	// const imgBuf = fs.readFileSync(backgroundImage);
	// const image = new Image;
	// image.src = imgBuf;
	// ctx.drawImage(image, 0, 0);

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	let i = -1;
	let frame = 0;

	// const breakTime = Date.now() - day * 3;
	const breakLine = 1758020 - 300_000;

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		i++;

		const [time,,x,y,color] = line.split(';');

		// if (Number(time) < breakTime) {
		// 	return
		// }
		if (i < breakLine) {
			return
		}

		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);

		if (i % PPF === 0) {
			const output = 'frames/' + String(++frame).padStart(8, '0') + '.png';

			fs.writeFileSync(output, canvas.toBuffer());
		}

		if (i % 54000 === 0) {
			console.log(`${Math.floor(frame / (1080))} minute, #${frame} frame, ${i} pixels`);
		}

		// if (i >= 1000) {
		// 	rl.pause();
		// 	rl.removeAllListeners('line');
		// 	rl.close();
		// 	console.log(`break, pixel #${i}, frame #${frame}`);
		// 	return;
		// }
	});

	rl.on('close', () => {
		const output = 'frames/' + String(++frame).padStart(8, '0') + '.png';

		fs.writeFileSync(output, canvas.toBuffer());

		console.log(`Total: ${Math.floor(frame / (1080))} minute(s), #${frame} frames, ${i} pixels`);
	});
}

// upscale('inout.png', 'upscaled.png', 3);

// drawDefaultCanvas('inout.png');

// drawDefaultCanvas('head2.png');
// drawDefaultCanvas('head3.png');
// drawDefaultCanvas('head4.png');
// drawDefaultCanvas('head5.png');
// drawDefaultCanvas('head6.png');

// drawDiffMask('./pixels.log', './output.png');

const filterByUUID = (input, output, uuid) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [,,,,,_uuid] = line.split(';');
		if (uuid !== _uuid) {
			file.write(line + '\n');
		}
	})
};

// filterByUUID('./pixels.log', 'pixels2.log', 'c1dc793a-ed45-4ff3-9730-a9fc2710afcc');

// checkLog('./pixels.log', '426x240.png', './output.png');

// recover('./pixels.log', './426x240.png', './output.png');

// drawSteps('./pixels.log', './426x240.png');

// ffmpeg -r 30 -i %08d.png -stream_loop -1 -i audio.mp3 -vf "scale=1704:960" -c:v libx264 -c:a aac -shortest output.mp4
// ffmpeg -r 30 -i %08d.png -i https://play.lofiradio.ru:8000/mp3_128 -vf "scale=1704:960" -c:v libx264 -c:a aac -shortest output.mp4
// ffmpeg -r 30 -i %08d.png -vf "scale=426:240" -c:v libx264 -c:a aac -shortest output.mp4
// 155.03s user 6.16s system 96% cpu 2:47.86 total (2.58 min)
// 206745 pixels.log 15*30*60=27000 7.65 min. video
// ~ 1 min
// 17 mb

const getDirectoriesRecursive = (directory) => {
	fs.readdirSync(directory).forEach((file) => {
		const absolutePath = path.join(directory, file);
		if (fs.statSync(absolutePath).isDirectory()) {
			getDirectoriesRecursive(absolutePath);
		} else {
			const [_, a, b, c] = directory.split('/');
			const [x, y, z] = file.split('');
			if (a === x && b === y && c === z) {
				console.log(file);
			}
		}
	});
}

getDirectoriesRecursive('./sessions');
