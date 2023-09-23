/**
 * сохраняет карту последних пикселей json
 */

const fs = require('fs');
const readline = require('readline');

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
};

module.exports = getPixelsInfo;
