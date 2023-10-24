/**
 * сохраняет лог пикселей тольк определённого юзера
 */

const fs = require('fs');
const readline = require('readline');

const filterByUUID = (input, output, uuid, ago) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time,,,,,_uuid] = line.split(';');

		if (uuid == _uuid) {
			return;
		}

		if (time && (Date.now() - ago) > time) {
			return
		}

		file.write(line + '\n');
	})
};

module.exports = filterByUUID;
