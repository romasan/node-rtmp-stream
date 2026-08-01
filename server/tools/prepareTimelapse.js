/**
 * Подготавливает bin файлы для timelapse
 */

const fs = require('fs');
const readline = require('readline');
const { createCanvas, Image } = require('canvas');
const { colorSchemes } = require('../constants/colorSchemes.ts');
const PART_PIXELS_COUNT = 100_000;

// npm run tools prepareTimelapse s3e1 assets/s3e1.png
// npm run tools prepareTimelapse s4e1 NOIMAGE
// rm -rf dist .parcel-cache && npm run build && cp -r tmp/timelapse ./dist/ && npx http-server dist
// http://localhost:8080/timelapse/#staticHost=http://localhost:8080

const hexToRgb = (hex) => [
	parseInt(hex.substring(1, 3), 16),
	parseInt(hex.substring(3, 5), 16),
	parseInt(hex.substring(5, 7), 16),
];

const rgb2num = ([r, g, b]) => (r << 16) | (g << 8) | b;

const num2rgb = (num) => [
	(num >> 16) & 0xFF,
	(num >> 8) & 0xFF,
	num & 0xFF
];

const u32toU16 = (num) => [
	(num >> 16) & 0xFFFF,
	num & 0xFFFF,
];

const u16tou32 = (high, low) => (high << 16) | (low & 0xFFFF);

const getSchemeColors = (colorScheme) => {
	const scheme = colorSchemes[colorScheme] || colorSchemes.COLORS_1;
	return Object.values(scheme);
};

const buildColorsCache = (colorScheme) => {
	const scheme = colorSchemes[colorScheme] || colorSchemes.COLORS_1;
	return Object.values(scheme)
		.reduce((list, color, index) => ({
			...list,
			[color]: index,
		}), {});
};

const prepareTimelapse = (
	season = 's1e1',
	backgroundImage = `${__dirname}/../../assets/426x240.png`,
) => {
	const expandsFile = `${__dirname}/../../db/archive/${season}/expands.log`;
	const pixelsFile = `${__dirname}/../../db/archive/${season}/pixels.log`;
	const timelapseFile = `${__dirname}/../../db/archive/${season}/timelapse/index.json`;
	const dirName = `${__dirname}/../../db/archive/${season}/timelapse/`;

	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName, { recursive: true });
	}

	const expandsRaw = fs.readFileSync(expandsFile).toString();
	const expands = expandsRaw
		.split('\n')
		.filter(Boolean)
		.map((item) => {
			const [time, index, width, height, shiftX, shiftY, colorScheme] = item.split(';');

			return {
				time: Number(time),
				index: Number(index),
				width: Number(width),
				height: Number(height),
				shiftX: Number(shiftX),
				shiftY: Number(shiftY),
				colorScheme: colorScheme === 'COLORS1' ? 'COLORS_1' : (colorScheme || 'COLORS_1'),
			};
		});

	let canvas = createCanvas(expands[0].width, expands[0].height);
	let ctx = canvas.getContext('2d');

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, expands[0].width, expands[0].height);

	if (backgroundImage && backgroundImage !== 'NOIMAGE') {
		const imgBuf = fs.readFileSync(backgroundImage);
		const image = new Image;

		image.src = imgBuf;
		ctx.drawImage(image, 0, 0);
	}

	let colorsCache = buildColorsCache(expands[0].colorScheme);

	const timelapse = {
		version: '2.0',
		colorSchemes,
		expands: [
			// {
			// 	canvas: { width, height },
			// 	index: { from, to },
			// 	part: { from, to },
			// 	shift: { x, y },
			// 	colorScheme: 0,
			// 	isTruecolor: false,
			// 	colors: [],
			// }
		],
		episode: season,
	};

	let index = 0;

	const rl = readline.createInterface({
		input: fs.createReadStream(pixelsFile),
		crlfDelay: Infinity
	});

	let expandIndex = -1;
	let partIndex = 0;

	let partPixels = [];

	let savePreview = false;

	let isTruecolor = expands[0].colorScheme === 'truecolor';

	rl.on('line', (line) => {
		// if (index >= _breakCount) {
		// 	return;
		// }

		while (expandIndex + 1 < expands.length && index >= expands[expandIndex + 1].index) {
			const newExpandIndex = expandIndex + 1;
			const prevIsTruecolor = isTruecolor;

			if (expandIndex >= 0) {
				// backup image
				const backupCanvas = createCanvas(canvas.width, canvas.height);
				const backupCtx = backupCanvas.getContext('2d');
				backupCtx.drawImage(canvas, 0, 0);
				// expand canvas
				canvas = createCanvas(expands[newExpandIndex].width, expands[newExpandIndex].height);
				ctx = canvas.getContext('2d');
				ctx.fillStyle = '#fff';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				// restore image с учётом сдвига старого канваса в новом
				ctx.drawImage(
					backupCanvas,
					expands[newExpandIndex].shiftX,
					expands[newExpandIndex].shiftY,
				);

				// закрыть текущую неполную часть предыдущего расширения
				if (partPixels.length) {
					packTimelapsePart(
						partPixels,
						`${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.bin`,
						prevIsTruecolor,
					);
					partPixels = [];
					partIndex++;
					savePreview = true;
				}
			}

			expandIndex = newExpandIndex;

			isTruecolor = expands[expandIndex].colorScheme === 'truecolor';
			colorsCache = buildColorsCache(expands[expandIndex].colorScheme);

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
					from: partIndex,
					to: partIndex
				},
				shift: {
					x: expands[expandIndex].shiftX,
					y: expands[expandIndex].shiftY,
				},
				colorScheme: expands[expandIndex].colorScheme,
				isTruecolor,
				colors: getSchemeColors(expands[expandIndex].colorScheme),
			};

			savePreview = true;
		}

		const expand = expands[expandIndex];

		timelapse.expands[expandIndex].index.to = index;
		timelapse.expands[expandIndex].part.to = partIndex;

		const [time, area, x, y, color, uuid] = line.split(';');

		// TODO date time in timelapse
		// const _date = new Date(time);
		// let [day, month, year] = ['getDate', 'getMonth', 'getFullYear'].map((key) => _date[key]());
		// month = MONTHS[month + 1];
		// const date = `${year.padStart(2, 0)}/${month.padStart(2, 0)}/${day.padStart(2, 0)}`;

		// канвасные координаты (мировые + сдвиг текущего расширения)
		const px = Number(x) + expand.shiftX;
		const py = Number(y) + expand.shiftY;

		if (isTruecolor) {
			const [high, low] = u32toU16(rgb2num(hexToRgb(color)));
			partPixels.push([high, low, px, py]);
		} else {
			if (colorsCache[color] === undefined) {
				console.warn(`Color ${color} not found in scheme ${expand.colorScheme} at index ${index}`);
			}
			partPixels.push([colorsCache[color] ?? 0, px, py]);
		}

		index++;

		if (partPixels.length >= PART_PIXELS_COUNT) {
			packTimelapsePart(
				partPixels,
				`${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.bin`,
				isTruecolor,
			);
			partPixels = [];
			partIndex++;
			// create preview image
			savePreview = true;
		}

		if (savePreview) {
			const output = `${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.png`;
			fs.writeFileSync(output, canvas.toBuffer());
			savePreview = false;
		}

		// drawPixel (координаты уже канвасные)
		ctx.fillStyle = color;
		ctx.fillRect(px, py, 1, 1);
	});

	rl.on('close', () => {
		if (partPixels.length) {
			packTimelapsePart(
				partPixels,
				`${__dirname}/../../db/archive/${season}/timelapse/${partIndex}.bin`,
				isTruecolor,
			);
		}

		timelapse.total = index - 1;
		timelapse.totalParts = partIndex;
		timelapse.partSize = PART_PIXELS_COUNT;

		fs.writeFileSync(timelapseFile, JSON.stringify(timelapse, true, 2));
	});
};

const gzipAB = async (input, compress = false) => {
	const cs = compress ? new CompressionStream('gzip') : new DecompressionStream('gzip');
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

const packTimelapsePart = async (list, output, isTruecolor) => {
	const length = isTruecolor ? 4 : 3;
	const binary_16 = new Uint16Array(list.length * length);

	list.forEach((item, index) => {
		binary_16[index * length] = item[0];
		binary_16[index * length + 1] = item[1];
		binary_16[index * length + 2] = item[2];

		if (isTruecolor) {
			binary_16[index * length + 3] = item[3];
		}
	});

	const binary_8 = new Uint8Array(binary_16.buffer, binary_16.byteOffset, binary_16.byteLength);
	const zipped = await gzipAB(binary_8, true);

	fs.writeFileSync(output, zipped);
};

const unpackTimelapsePart = async (file, isTruecolor) => {
	const length = isTruecolor ? 4 : 3;
	const zipped = fs.readFileSync(file);
	const binary_8 = await gzipAB(zipped);
	const binary_16 = new Uint16Array(binary_8.buffer);
	const data = [];
	let item = [];

	binary_16.forEach((value) => {
		item.push(value);

		if (item.length === length) {
			data.push(
				isTruecolor
					? {
						colorRGB: num2rgb(u16tou32(item[0], item[1])),
						x: item[2],
						y: item[3],
					}
					: item
			);
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