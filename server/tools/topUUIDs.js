/**
 * сохраняет список топ uuid по количеству точек
 */

const fs = require('fs');
const readline = require('readline');

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
};

module.exports = topUUIDs;
