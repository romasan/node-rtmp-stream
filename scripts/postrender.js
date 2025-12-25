const fs = require('fs');

const replaceInFile = (file, callback) => {
	const source = fs.readFileSync(file).toString();

	fs.writeFileSync(file, callback(source));
};

replaceInFile(
    __dirname + '/../dist/index.html',
    (source) => source.replace(/http:\/\/localhost:[\d]+/ig, ''),
);
