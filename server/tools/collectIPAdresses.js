const fs = require('fs');
const Progress = require('cli-progress');
// const { fileLinesCount } = require('./helpers');
const { addSessionForIP } = require('../helpers');
const path = require('path');
const readline = require('readline');

const dir = (dirPath, callback, dirFilter) => {
	const data = fs.readdirSync(dirPath);

	data.forEach((file) => {
		const filePath = `${dirPath}/${file}`;

		if (fs.lstatSync(filePath).isDirectory()) {
			// console.log('==== D', filePath);
			const next = dirFilter ? dirFilter(file) : true;

			if (next) {
				dir(filePath, callback);
			}
		} else {
			if (file[0] === '.') {
				return;
			}
			callback(filePath, file);
			// const session = fs.readFileSync(`${dirPath}/${file}`);
			// const ip = '';
			// addSessionForIP(ip, file);
		}
	});
};

const collectIPAdresses = () => {
	const list = [];

	dir('./db/sessions', (filePath, file) => {
		if (file[0] === '.') {
			return;
		}
		list.push(filePath);
	});

	let count = 0;
	const bar = new Progress.Bar();

	bar.start(list.length, 0);

	for (const filePath of list) {
		const lines = fs.readFileSync(filePath).toString().split('\n');
		const token = filePath.split('/').pop();
		const [time, ip] = lines[lines.length - 2].split(';');

		addSessionForIP(ip, token, time);

		bar.update(++count);
	}

	bar.stop();
};

const updatePixelsWithoutIP = (INPUT, OUTPUT) => {
	const list = [];

	dir(
		'./db/sessions',
		(filePath, file) => {
			if (file[0] === '.') {
				return;
			}
			list.push(filePath);
		},
		(name) => name !== 'network',
	);

	console.log('====', list.length);

	const filesLinesCount = {};
	const files = {};
	const uuidsIP = {};

	let count = 0;
	const bar = new Progress.Bar();
	bar.start(list.length, 0);

	for (const filePath of list) {
		const lines = fs.readFileSync(filePath).toString().split('\n');
		const token = filePath.split('/').pop();
		const [time, ip] = lines[lines.length - 2].split(';');

		uuidsIP[token] = ip;

		const linesCount = lines.length;
		filesLinesCount[linesCount] = (filesLinesCount[linesCount] || 0) + 1;
		files[linesCount] = (files[linesCount] || []).concat([filePath]);

		bar.update(++count);
	}

	bar.stop();

	const file = fs.createWriteStream(OUTPUT);
	const rl = readline.createInterface({
		input: fs.createReadStream(INPUT),
		crlfDelay: Infinity
	});

	rl.on('line', (line) => {
		let [time, nick, x, y, color, token, ip] = line.split(';');

		if (!ip) {
			ip = uuidsIP[token] || '';
			file.write(line + ';' + ip + '\n');
		} else {
			file.write(line + '\n');
		}
	});
};

const updateSessionFilesDepth = () => {
	const list = [];

	dir(
		'./db/sessions',
		(filePath, file) => {
			if (file[0] === '.') {
				return;
			}

			list.push(filePath);
		},
		(name) => name !== 'network',
	);

	let count = 0;
	const bar = new Progress.Bar();
	bar.start(list.length, 0);

	for (const filePath of list) {
		const token = filePath.split('/').pop();
		const prefix = token.slice(0, 2);
		const to = `${__dirname}/../../db/sessions/depth1/${prefix}/${token}`;
		const dirname = path.dirname(to);

		fs.mkdirSync(dirname, { recursive: true });
		fs.renameSync(filePath, to);

		bar.update(++count);
	}

	bar.stop();
};

module.exports = {
	updateSessionFilesDepth,
	collectIPAdresses,
	updatePixelsWithoutIP,
};
