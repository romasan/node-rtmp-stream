const fs = require('fs');
const readline = require('readline');
const Progress = require('cli-progress');
const { getPathByToken } = require('../helpers');
const { getFileLinesCount } = require('../helpers');

const calcSessionsWithOneIP = async () => {
	const path = __dirname + '/../../db/list';
	const cache = {};
	// const errors = [];

	const length = await getFileLinesCount(path);
	let count = 0;

	const rl = readline.createInterface({
		input: fs.createReadStream(path),
		crlfDelay: Infinity
	});

	const bar = new Progress.Bar();

	bar.start(length, 0);

	let errorsCount = 0;

	rl.on('line', (token) => {
		bar.update(++count);
		const filePath = getPathByToken(token, false);

		if (fs.existsSync(filePath)) {
			const lines = fs.readFileSync(filePath)
				.toString()
				.split('\n')
				.filter(Boolean);
			const ips = {};

			lines.forEach((line) => {
				const _ips = line.split(';')[1]
					.split(':')
					.pop()
					.split(', ');
				_ips.forEach((ip) => {
					ips[ip] = true;
				});
			});

			Object.keys(ips).forEach((ip) => {
				if (ip.length > 1) {
					cache[ip] = (cache[ip] || []).concat(token);
				}
			});
		} else {
			// console.log('Fail on open:', filePath);
			// errors.push(token);
			errorsCount++;
		}
	});

	rl.on('close', () => {
		bar.stop();
		// JSON.stringify(sortMyObj, Object.keys(sortMyObj).sort())
		const _keys = Object.entries(cache)
			.sort(([,a], [,b]) => a.length < b.length ? 1 : -1)
			.map(([key]) => key);
		const _cache = {};

		Object.entries(cache).forEach(([key, value]) => {
			_cache[key] = value.length;
		});

		fs.writeFileSync(
			__dirname + '/ip-tokens.json',
			JSON.stringify(cache, _keys, 2),
		);

		fs.writeFileSync(
			__dirname + '/ip-count.json',
			JSON.stringify(_cache, _keys, 2),
		);

		// fs.writeFileSync(__dirname + '/failed-tokens.json', JSON.stringify(errors, true, 2));
		console.log('IPs count:', Object.keys(_cache).length);
		console.log('Errors count:', errorsCount);
	});
};

module.exports = {
	calcSessionsWithOneIP,
};
