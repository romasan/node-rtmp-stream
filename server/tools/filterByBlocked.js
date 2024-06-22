const readline = require('readline');
const fs = require('fs');
const bansJSON = require('../../db/bans.json');

const filterByBlocked = (input, output) => {
	const rl = readline.createInterface({
		input: fs.createReadStream(input),
		crlfDelay: Infinity
	});

	const file = fs.createWriteStream(output);

	rl.on('line', (line) => {
		const [time, area, x, y, color, token, ip, nickname] = line.split(';');
		const IPs = ip.split(', ');

		if (IPs.some((_ip) => bansJSON.ip[_ip])) {
			return;
		}

    if (bansJSON.nick[nickname]) {
      return;
    }

		file.write(line + '\n');
	});
};

module.exports = {
	filterByBlocked,
};
