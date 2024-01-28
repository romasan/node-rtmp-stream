const fs = require('fs');
const path = require('path');
const { fileLinesCount } = require('./helpers');

// db/network/192/168/192.168.1.1
// 2352345-325-2345-2354-234523
const addSessionForIP = (ip, fileContent) => {
	const list = ip.split('.')
	const filePath = `${__dirname}/../../db/sessions/network/${list[0]}/${list[1]}/${ip}`;
	const dirname = path.dirname(filePath);

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
		fs.writeFileSync(filePath, fileContent);
	} else {
		fs.appendFileSync(filePath, fileContent);
	}
};

const dir = (dirPath, list) => {
	const data = fs.readdirSync(dirPath);

	data.forEach((file) => {
		const filePath = `${dirPath}/${file}`;

		if (fs.lstatSync(filePath).isDirectory()) {
			// console.log('==== D', filePath);
			dir(filePath, list);
		} else {
			if (file[0] === '.') {
				console.log('==== F', filePath);
			}
			list.push(filePath);
			// const session = fs.readFileSync(`${dirPath}/${file}`);
			// const ip = '';
			// addSessionForIP(ip, file);
		}
	});
}
const collectIPAdresses = async () => {
	const list = [];
	dir('./db/sessions', list);
	const count = await fileLinesCount('./db/list');
	console.log('====', list.length, count);
};

module.exports = collectIPAdresses;
