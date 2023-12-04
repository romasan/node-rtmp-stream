const { time } = require('console');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { createCanvas, Image } = require('canvas');
const { COLORS_1 } = require('../const.json')

const PART_PIXELS_COUNT = 100_000;

const prepareTimelapse = (season = 's1e1', backgroundImage = `${__dirname}/../../assets/426x240.png`) => {
	const expandsFile = `${__dirname}/../../db/archive/${season}/expands.log`;
	const pixelsFile = `${__dirname}/../../db/archive/${season}/pixels.log`;
	const timelapseFile = `${__dirname}/../../db/archive/${season}/timelapse/index.json`;

	const dirname = path.dirname(`${__dirname}/../../db/archive/${season}/timelapse`);

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}

	let canvas = null;
	let ctx = null;

	if (backgroundImage) {
		const imgBuf = fs.readFileSync(backgroundImage);
		const image = new Image;
		image.src = imgBuf;
		canvas = createCanvas(image.width, image.height);
		ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);
	}

	const colorsCache = Object.values(COLORS_1).reduce((list, color, index) => ({
		...list,
		[color]: index,
	}), {});

	const timelapse = {
		colors: Object.values(COLORS_1),
		expands: [],
		days: {
			// "01.01.2023": {
			// 	from: 0,
			// 	to: 9999
			// },
			// "01.02.2023": {
			// 	from: 10000,
			// 	to: 25000
			// }
		}
	};

	const expandsRaw = fs.readFileSync(expandsFile).toString();
	const expands = expandsRaw.split('\n').filter(Boolean).map((item) => {
		const [time, index, width, height, shiftX, shiftY] = item.split(';');

		return {
			time: Number(time),
			index: Number(index),
			width: Number(width),
			height: Number(height),
			shiftX: Number(shiftX),
			shiftY: Number(shiftY),
		};
	});

	// const _breakCount = 100_000;
	let index = 0;

	const rl = readline.createInterface({
		input: fs.createReadStream(pixelsFile),
		crlfDelay: Infinity
	});

	let expandIndex = -1;
	let partIndex = -1;

	let partPixels = [];

	let savePreview = false;

	rl.on('line', (line) => {
		// if (index >= _breakCount) {
		// 	return;
		// }

		const newExpandIndex = expands.filter((item) => index >= item.index).length - 1;

		if (newExpandIndex > expandIndex) {
			if (expandIndex >= 0) {
				// backup image
				const backupCanvas = createCanvas(canvas.width, canvas.height);
				const backupCtx = backupCanvas.getContext('2d');
				backupCtx.drawImage(canvas, 0, 0);
				// expand canvas
				canvas = createCanvas(expands[newExpandIndex].width, expands[newExpandIndex].height);
				ctx = canvas.getContext('2d');
				// restore image
				ctx.drawImage(backupCanvas, 0, 0); // shiftx, shiftY
			}

			expandIndex = newExpandIndex;

			timelapse.expands[expandIndex] = {
				canvas: {
					width: expands[expandIndex].width,
					height: expands[expandIndex].height,
				},
				index: {
					from: index,
					to: index,
				},
				part: {
					from: partIndex + 1,
					to: partIndex + 1
				}
			};

			if (index) {
				packTimelapsePart(
					partPixels,
					`${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.bin`,
				);
				partPixels = [];
			} else {
				// save preview image expandIndex.png
				savePreview = true;
			}

			partIndex++;
		}

		timelapse.expands[expandIndex].index.to = index;
		timelapse.expands[expandIndex].part.to = partIndex;

		const [time, nick, x, y, color, uuid] = line.split(';');

		// TODO
		// const _date = new Date(time);
		// let [day, month, year] = ['getDate', 'getMonth', 'getFullYear'].map((key) => _date[key]());
		// month = MONTHS[month + 1];
		// const date = `${year.padStart(2, 0)}/${month.padStart(2, 0)}/${day.padStart(2, 0)}`;

		partPixels.push([colorsCache[color], Number(x), Number(y)]);

		index++;

		if (savePreview) {
			const output = `${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.png`;
			fs.writeFileSync(output, canvas.toBuffer());
			savePreview = false;
		}

		// drawPixel
		ctx.fillStyle = color;
		ctx.fillRect(x, y, 1, 1);

		if (partPixels.length >= PART_PIXELS_COUNT) {
			packTimelapsePart(
				partPixels,
				`${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.bin`,
			);
			partPixels = [];
			partIndex++;
			// create preview image
			savePreview = true;
		}
	});

	rl.on('close', () => {
		if (partPixels.length) {
			packTimelapsePart(
				partPixels,
				`${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.bin`,
			);
		}

		timelapse.total = index - 1;
		timelapse.totalParts = partIndex;

		fs.writeFileSync(timelapseFile, JSON.stringify(timelapse, true, 2));
	});
};

const gzipAB = async (input, compress = false) => {
	const cs = compress ? new CompressionStream("gzip") : new DecompressionStream("gzip");
	const writer = cs.writable.getWriter();
	const reader = cs.readable.getReader();
	const output = [];
	let totalSize = 0;

	writer.write(input);
	writer.close();

	for (let item; (item = await reader.read()) && !item.done;) {
		output.push(item.value);
		totalSize += item.value.byteLength;
	}

	const concatenated = new Uint8Array(totalSize);
	let offset = 0;

	for (const array of output) {
		concatenated.set(array, offset);
		offset += array.byteLength;
	}

	return concatenated;
};

const packTimelapsePart = async (json, output) => {
	// const json = require('../../db/archive/s1e1/timelapse/0.json');

	const binary_16 = new Uint16Array(json.length * 3);

	json.forEach((item, index) => {
		binary_16[index * 3] = item[0];
		binary_16[index * 3 + 1] = item[1];
		binary_16[index * 3 + 2] = item[2];
	});

	const binary_8 = new Uint8Array(binary_16.buffer, binary_16.byteOffset, binary_16.byteLength);
	const zipped = await gzipAB(binary_8, true);

	fs.writeFileSync(output, zipped);
};

const unpackTimelapsePart = async () => {
	const zipped = fs.readFileSync(`${__dirname}/debug.bin`);
	const binary_8 = await gzipAB(zipped);
	const binary_16 = new Uint16Array(binary_8.buffer);
	const data = [];
	let item = [];

	binary_16.forEach((value) => {
		item.push(value);
		if (item.length === 3) {
			data.push(item);
			item = [];
		}
	});

	fs.writeFileSync(`${__dirname}/debug.json`, JSON.stringify(data));
};

module.exports = {
	prepareTimelapse,
	packTimelapsePart,
	unpackTimelapsePart,
};
