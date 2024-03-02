const readline = require('readline');
const fs = require('fs');
const bansJSON = require('../../db/bans.json');

const filterByIP = (input, output, ipAddress) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [,,,,,,ip] = line.split(';');

		if (ip === ipAddress) {
			return;
		}

		file.write(line + '\n');
	});
};

const filterByBlocked = (input, output) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [,,,,,,ip] = line.split(';');

		if (bansJSON.ip[ip]) {
			return;
		}

		file.write(line + '\n');
	});
};

module.exports = {
	filterByIP,
	filterByBlocked,
};
