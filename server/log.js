const fs = require('fs');

const file = fs.createWriteStream(__dirname + '/pixels.log', { flags : 'a' });

const log = ({ x, y, color, nickname }) => {
	file.write([Date.now(), nickname, x, y, color].join(';') + '\n');
}

module.exports = log;
