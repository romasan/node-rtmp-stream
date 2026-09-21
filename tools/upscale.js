/**
 * берёт картинку и растягивает, сохраняет
 */

const fs = require('fs');
const { createCanvas, Image } = require('canvas');

const upscale = (input, ouptut, scale) => {
	const imgBuf = fs.readFileSync(input);
	const image = new Image;
	image.src = imgBuf;

	const canvas = createCanvas(image.width * scale, image.height * scale);
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);

	fs.writeFileSync(ouptut, canvas.toBuffer());
};

module.exports = upscale;
