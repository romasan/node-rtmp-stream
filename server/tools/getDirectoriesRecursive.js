/**
 * выводит на экран uuid сессий из дерева
 */

const fs = require('fs');

const getDirectoriesRecursive = (directory) => {
	fs.readdirSync(directory)
	 .forEach((file) => {
		const absolutePath = path.join(directory, file);
		if (fs.statSync(absolutePath).isDirectory()) {
			getDirectoriesRecursive(absolutePath);
		} else {
			const [_, a, b, c] = directory.split('/');
			const [x, y, z] = file.split('');
			if (a === x && b === y && c === z) {
				console.log(file);
			}
		}
	});
};

module.exports = getDirectoriesRecursive;
