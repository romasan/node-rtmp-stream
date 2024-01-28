const fs = require('fs');
const readline = require('readline');

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
	];
};

const RGBToHEX = ([r, g, b]) => '#' +
	r.toString(16).padStart(2, '0') +
	g.toString(16).padStart(2, '0') +
	b.toString(16).padStart(2, '0');

const readJSON = (file) => new Promise((resolve) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(file),
		crlfDelay: Infinity
	});

	const lines = [];

	rl.on('line', (line) => {
		lines.push(line);
	});

	rl.on('close', () => {
		resolve(JSON.parse(lines.join('')));
	});
});

const fileLinesCount = (file) => new Promise((resolve) => {
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

module.exports = {
	HSLToRGB,
	RGBToHEX,
	readJSON,
	fileLinesCount,
};
