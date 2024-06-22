const fs = require('fs');
const readline = require('readline');
const { getUserData } = require('../utils/auth');

const preparePixelsLog = (input, output) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time,, x, y, color, uuid, ip] = line.split(';');

		const user = getUserData(uuid);

		const newLine = [
			time,
			user?.area || '',
			x,
			y,
			color,
			uuid,
			ip,
			user?.name || ''
		].join(';');

		file.write(newLine + '\n');
	});
};

module.exports = {
	preparePixelsLog,
};
