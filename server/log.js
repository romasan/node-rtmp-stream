const fs = require('fs');

const file = fs.createWriteStream(__dirname + '/../db/pixels.log', { flags : 'a' });

const log = ({ x, y, color, nickname, uuid }) => {
	file.write([Date.now(), nickname, x, y, color, uuid].join(';') + '\n');
};

module.exports = log;
