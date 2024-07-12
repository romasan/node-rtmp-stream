const path = require('path');
const fs = require('fs');
const { Log } = require('../utils/log');

const addSessionForIP = (ip, token, time = Date.now()) => {
	const _ip = ip.split(':').pop();
	const [a, b] = _ip.split('.');

	if (!a || !b) {
		Log('Error: failed parse IP', ip);

		return;
	}

	const filePath = `${__dirname}/../../db/sessions/network/${a}/${_ip}`;
	const dirname = path.dirname(filePath);
	const content = [time, token].join(';') + '\n';

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
		fs.writeFileSync(filePath, content + '\n');
	} else {
		fs.appendFileSync(filePath, content + '\n');
	}
};

module.exports = {
	addSessionForIP,
};
