const fs = require('fs');

const logFile = fs.createWriteStream(__dirname + '/../../db/log', { flags : 'a' });
const pixelsFile = fs.createWriteStream(__dirname + '/../../db/pixels.log', { flags : 'a' });

const _log = (type, ...attrs) => {
	logFile.write([type, new Date(), ...attrs].join('\n') + '\n');

	console.log([new Date(), attrs].join('\n'));
};

const log = (...attrs) => {
	_log('[LOG]:', ...attrs);
};

const error = (...attrs) => {
	_log('[ERROR]:', ...attrs);
};

const pixelsLog = ({ x, y, color, nickname, uuid, ip }) => {
	pixelsFile.write([Date.now(), nickname, x, y, color, uuid, ip].join(';') + '\n');
};

module.exports = {
	log,
	error,
	pixelsLog,
};
