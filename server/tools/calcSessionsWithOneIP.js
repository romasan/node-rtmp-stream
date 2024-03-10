const fs = require('fs');
const readline = require('readline');
const Progress = require('cli-progress');
const { getPathByToken } = require('../helpers');
const { fileLinesCount } = require('./helpers');

const calcSessionsWithOneIP = async () => {
	const path = __dirname + '/../../db/list';
	const cache = {};
	// const errors = [];

	const length = await fileLinesCount(path);
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
			const ip = fs.readFileSync(filePath)
				.toString()
				.split('\n')[0]
				.split(';')[1]
				.split(':')
				.pop();

			cache[ip] = (cache[ip] || []).concat(token);
		} else {
			// console.log('Fail on open:', filePath);
			// errors.push(token);
			errorsCount++;
		}
	});

	rl.on('close', () => {
		bar.stop();
		// JSON.stringify(sortMyObj, Object.keys(sortMyObj).sort())
		fs.writeFileSync(
			__dirname + '/ip-tokens.json',
			JSON.stringify(
				cache,
				Object.entries(cache)
					.sort(([,a], [,b]) => a.length < b.length ? 1 : -1)
					.map(([key]) => key),
				2,
			),
		);
		// fs.writeFileSync(__dirname + '/failed-tokens.json', JSON.stringify(errors, true, 2));
		console.log('Errors count:', errorsCount);
	});
};

module.exports = {
	calcSessionsWithOneIP,
};
