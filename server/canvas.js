require('dotenv').config();
const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const { COLORS } = require('./const');
const log = require('./log');
const ee = require('./lib/ee');

const { IN_OUT_IMAGE, UPSCALE } = process.env;

const scale = Number(UPSCALE) || 1;

const imgBuf = fs.readFileSync(IN_OUT_IMAGE);
const image = new Image;
image.src = imgBuf;

const canvas = createCanvas(image.width, image.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0);

let scaledCanvas = null;
let scaledCTX = null;

if (scale > 1) {
	scaledCanvas = createCanvas(image.width * scale, image.height * scale);
	scaledCTX = scaledCanvas.getContext('2d');
	scaledCTX.imageSmoothingEnabled = false;
	scaledCTX.drawImage(image, 0, 0, image.width * scale, image.height * scale);
}

const getImageBuffer = () => {
	if (scale > 1 && scaledCanvas) {
		return scaledCanvas.toBuffer();
	}

	return canvas.toBuffer();
}

const drawPix = ({ x, y, color, nickname, uuid}) => {
	if (x < 0 || y < 0 || x > canvas.width || y > canvas.width || !COLORS[color]) {
		return;
	}

	const rawColor = COLORS[color];

	ctx.fillStyle = rawColor;
	ctx.fillRect(x, y, 1, 1);

	if (scale > 1 && scaledCTX) {
		scaledCTX.fillStyle = rawColor;
		scaledCTX.fillRect(x * scale, y * scale, 1 * scale, 1 * scale);
	}

	log({x, y, color: rawColor, nickname});
	ee.emit('spam', {
		event: 'drawPix',
		payload: {
			x,
			y,
			color: rawColor,
		},
	});
}

const saveCanvas = () => {
	fs.writeFileSync(IN_OUT_IMAGE, canvas.toBuffer());
}

module.exports = {
	canvas,
	COLORS,
	drawPix,
	saveCanvas,
	getImageBuffer,
};


/*

const fs = require('fs');
const { promisify } = require('util');

// Функция для чтения файла
const readFileAsync = promisify(fs.readFile);

// Путь к изображению, которое нужно отправить в stdout
const imagePath = 'path/to/image.png';

async function main() {
  // Прочитать изображение
  const imageBuffer = await readFileAsync(imagePath);

  // Заголовок PPM-изображения
  const header = `P6\n${image.width} ${image.height}\n255\n`;

  // Преобразовать изображение в PPM
  const pixelData = Buffer.from(imageBuffer).toString('binary');
  const imageData = pixelData.replace(/^data:image\/\w+;base64,/, '');
  const decodedImage = Buffer.from(imageData, 'base64');
  const imagePPM = Buffer.concat([Buffer.from(header), decodedImage]);

  // Отправить PPM-изображение в stdout
  process.stdout.write(imagePPM);
}


*/