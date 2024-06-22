/**
 * сохраняет лог пикселей определённой координаты
 */

const fs = require('fs');
const readline = require('readline');

const filterByXY = (input, output, x, y) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time, area, _x, _y, color, uuid] = line.split(';');

		if (x === _x && y === _y) {
			file.write(line + '\n');
		}
	})
};

module.exports = filterByXY;
