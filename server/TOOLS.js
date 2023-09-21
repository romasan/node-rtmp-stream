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

const drawDiffMask = (file, output, uuid) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		const [time, nick, x, y, color, _uuid] = line.split(';');

		if (uuid) {
			if (_uuid === uuid) {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		} else {
			ctx.fillStyle = '#00000033';
			ctx.fillRect(x, y, 1, 1);
		}


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
		const [time, nick, x, y, color] = line.split(';');

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

const PPF = 100;

const drawSteps = (file, backgroundImage) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	const imgBuf = fs.readFileSync(backgroundImage);
	const image = new Image;
	image.src = imgBuf;
	ctx.drawImage(image, 0, 0);

	// ctx.fillStyle = '#ffffff';
	// ctx.fillRect(0, 0, WIDTH, HEIGHT);

	let i = -1;
	let frame = 0;

	// const breakTime = Date.now() - day * 3;
	// const breakLine = 1758020 - 300_000;

	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		i++;

		const [time, name, x, y, color] = line.split(';');

		// if (Number(time) < breakTime) {
		// 	return
		// }

		// if (i < breakLine) {
		// 	return
		// }

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

const getPixelsInfo = (file, output) => {
	const list = {};
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});
	
	rl.on('line', (line) => {
		const [time, nick, x, y, color, uuid] = line.split(';');

		list[`${x}:${y}`] = { time, color, uuid };
	});

	rl.on('close', () => {
		fs.writeFileSync(output, JSON.stringify(list, true, 2));
	});
}

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

	console.log('====', count);

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
}

const HSLToRGB = ([h, s, l]) => {
	if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
		return [0, 0, 0];
	}

	s /= 100;
	l /= 100;

	if (s === 0) {
		const value = Math.round(l * 255);

		return [value, value, value];
	}

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let rgb;

	if (h >= 0 && h < 60) {
		rgb = [c, x, 0];
	} else if (h >= 60 && h < 120) {
		rgb = [x, c, 0];
	} else if (h >= 120 && h < 180) {
		rgb = [0, c, x];
	} else if (h >= 180 && h < 240) {
		rgb = [0, x, c];
	} else if (h >= 240 && h < 300) {
		rgb = [x, 0, c];
	} else if (h >= 300 && h < 360) {
		rgb = [c, 0, x];
	}

	const [r, g, b] = rgb;

	return [
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
	]
}

const RGBToHEX = ([r, g, b]) => '#' +
	r.toString(16).padStart(2, '0') +
	g.toString(16).padStart(2, '0') +
	b.toString(16).padStart(2, '0');

const heatmap = (file, output) => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const list = [];
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	// let max = 0;

	rl.on('line', (line) => {
		const [time, nick, x, y, color, uuid] = line.split(';');

		if (!list[x]) {
			list[x] = [];
		}

		list[x][y] = (list[x][y] | 0) + 1;

		// max = debugValue || Math.max(max, list[x][y]);
	});

	rl.on('close', () => {
		const sorted = list
			.reduce((list, item) => [
				...list,
				...item, // .filter((e) => !list.includes(e))
			], [])
			.reduce((list, e) => list.includes(e) ? list : [...list, e], [])
			.sort((a, b) => a < b ? 1 : -1);
		const med = sorted[Math.floor(sorted.length / 2)];
		
		// const _sorted = list
		// 	.reduce((list, item, x) => [
		// 		...list,
		// 		...item.map((value, y) => ({ value, x, y })),
		// 	], [])
		// 	.sort((a, b) => a.value < b.value ? 1 : -1)
		// 	.map((e) => `${e?.x}-${e?.y}: ${e?.value}`);

		// fs.writeFileSync(
		// 	'./pixels.top',
		// 	sorted.join('\n'),
		// );

		for (const x in list) {
			for (const y in list[x]) {
				const h = (1.0 - (Math.min(list[x][y] / med, 1))) * 240;
				const hsl = [h, 100, 50];
				const rgb = HSLToRGB(hsl);
				const color = RGBToHEX(rgb);

				// if (list[x][y] > 1000) {
				// 	console.log('====', med, list[x][y], x, y, hsl, rgb);
				// }
				// if (list[x][y] < med * 2) {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
				// }
			}
		}

		fs.writeFileSync(output, canvas.toBuffer());
	});
};

const filterByXY = (input, output, x, y) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time, nick, _x, _y, color, uuid] = line.split(';');

		if (x === _x && y === _y) {
			file.write(line + '\n');
		}
	})
};

const topUUIDs = (input, output) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	// const file = fs.createWriteStream(output);

	const UUIDs = {};

	rl.on('line', (line) => {
		const [time, nick, _x, _y, color, uuid] = line.split(';');

		UUIDs[uuid] = (UUIDs[uuid] || 0) + 1;
	});

	rl.on('close', () => {
		fs.writeFileSync(
			output,
			Object.entries(UUIDs)
				.sort(([, aValue], [, bValue]) => aValue < bValue ? 1 : -1)
				.map(([uuid, count]) => `${uuid}: ${count}`)
				.join('\n'),
		);
	});

	// file.write(line + '\n');
}

// const _map = require('./map.json');
// console.log('====', _map['0:0']?.uuid);

getPixelsInfo('./pixels.log', './map.json');
// upscale('inout.png', 'upscaled.png', 3);
// drawDefaultCanvas('inout.png');
// drawDiffMask('./pixels.log', './output.png');
// drawDiffMask('./pixels.log', './output.png', 'cf610675-9af1-4fea-b268-b2d13f5d816e');
// filterByUUID('./pixels.log', 'pixels2.log', 'c1dc793a-ed45-4ff3-9730-a9fc2710afcc');
// checkLog('./pixels.log', '426x240.png', './output.png');
// recover('./pixels.log', './426x240.png', './output.png');
// drawSteps('./pixels.log', './426x240.png');
// getDirectoriesRecursive('./sessions');
// heatmap('./pixels.log', './output.png');
// filterByXY('./pixels.log', 'pixels.output', '143', '86');
// genMapByUsers(_map, './output.png');
// topUUIDs('./pixels.output', './uuids.top')

const LIST = {
	drawDefaultCanvas,       // сохраняет в файл картинку в клеточку
	upscale,                 // берёт картинку и растягивает, сохраняет
	drawDiffMask,            // сохраняет картинку с пикселями конкретного юзера (или аналог heatmap)
	checkLog,                // сохраняет пиксели с определённого времени
	recover,                 // сохраняет картинку со всеми пикселями
	drawSteps,               // каждые N пикселей сохраняет кадр в файл
	filterByUUID,            // сохраняет лог пикселей тольк определённого юзера
	getDirectoriesRecursive, // выводит на экран uuid сессий из дерева
	getPixelsInfo,           // сохраняет карту последних пикселей json
	genMapByUsers,           // получает карту пикселей рисует пиксели с уникальным цветом для юзера
	heatmap,                 // сохраняет картинку с тепловой картой по точкам
	filterByXY,              // сохраняет лог пикселей определённой координаты
	topUUIDs,                // сохраняет список топ uuid по количеству точек
}

// ffmpeg -r 30 -i %08d.png -stream_loop -1 -i audio.mp3 -vf "scale=1704:960" -c:v libx264 -c:a aac -shortest output.mp4
// ffmpeg -r 30 -i %08d.png -i https://play.lofiradio.ru:8000/mp3_128 -vf "scale=1704:960" -c:v libx264 -c:a aac -shortest output.mp4
// ffmpeg -r 30 -i %08d.png -vf "scale=426:240" -c:v libx264 -c:a aac -shortest output.mp4
// 155.03s user 6.16s system 96% cpu 2:47.86 total (2.58 min)
// 206745 pixels.log 15*30*60=27000 7.65 min. video
// ~ 1 min
// 17 mb

// ffmpeg -i https://play.lofiradio.ru:8000/mp3_128 -r 30 -i %08d.png -vf "scale=426:240" -c:v libx264 -c:a aac -shortest output.mp4
