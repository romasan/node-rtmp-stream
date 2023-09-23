/**
 * сохраняет лог пикселей тольк определённого юзера
 */

const fs = require('fs');
const readline = require('readline');

const filterByUUID = (input, output, uuid) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [,,,,,_uuid] = line.split(';');
		if (uuid !== _uuid) {
			file.write(line + '\n');
		}
	})
};

module.exports = filterByUUID;
