const fs = require('fs');

const pixelsFile = fs.createWriteStream(__dirname + '/../../db/pixels.log', { flags : 'a' });

const pixelsLog = ({ x, y, color, nickname, uuid, ip }) => {
	pixelsFile.write([Date.now(), nickname, x, y, color, uuid, ip].join(';') + '\n');
};

module.exports = {
	pixelsLog,
};
