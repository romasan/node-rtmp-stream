const fs = require('fs');

const file = fs.createWriteStream(__dirname + '/../db/pixels.log', { flags : 'a' });

const log = ({ x, y, color, nickname, uuid, ip }) => {
	file.write([Date.now(), nickname, x, y, color, uuid, ip].join(';') + '\n');
};

module.exports = log;
