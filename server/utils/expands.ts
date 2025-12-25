import fs, { WriteStream } from 'fs';
import path from 'path';
import { getTotalPixels } from './stats';

const expandsFile = __dirname + '/../../db/expands.log';
let file: WriteStream;
let data = {
	colorScheme: 'COLORS_1',
	width: 100,
	height: 100,
	shiftX: 0,
	shiftY: 0,
};

if (!fs.existsSync(expandsFile)) {
	const dirname = path.dirname(expandsFile);

	fs.mkdirSync(dirname, { recursive: true });
	fs.writeFileSync(expandsFile, `0;0;${data.width};${data.height};${data.shiftX};${data.shiftY};${data.colorScheme}`);
}

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
