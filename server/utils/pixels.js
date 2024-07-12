/**
 * сохраниение поставленных пикселей
 */

const fs = require('fs');

const pixelsFile = fs.createWriteStream(__dirname + '/../../db/pixels.log', { flags : 'a' });

const pixelsLog = ({ x, y, color, area, uuid, ip, nickname }) => {
	pixelsFile.write([Date.now(), area, x, y, color, uuid, ip, nickname].join(';') + '\n');
};

module.exports = {
	pixelsLog,
};
