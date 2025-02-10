import fs, { WriteStream } from 'fs';
import { getTotalPixels } from './stats';

const expandsFile = __dirname + '/../../db/expands.log';
let file: WriteStream;

let data = {
	colorScheme: '',
	width: 0,
	height: 0,
	shiftX: 0,
	shiftY: 0,
};

export const expandsInit = () => {
	const [,, width, height, shiftX, shiftY, colorScheme] = String(
		fs.readFileSync(expandsFile)
			.toString()
			.split('\n')
			.filter(Boolean)
			.pop()
		)
		.split(';');

	data = {
		width: Number(width),
		height: Number(height),
		shiftX: Number(shiftX),
		shiftY: Number(shiftY),
		colorScheme,
	};

	file = fs.createWriteStream(expandsFile, { flags : 'a' });
};

export const expand = (width: number, height: number, shiftX: number, shiftY: number, colorScheme: string) => {
	file.write([
		Date.now(),
		getTotalPixels(),
		width,
		height,
		shiftX,
		shiftY,
		colorScheme,
	].join(';') + '\n');

	data = {
		width: width,
		height: height,
		shiftX,
		shiftY,
		colorScheme,
	};
};

export const getExpand = () => data;
