const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;
const argv = yargs(hideBin(process.argv)).argv?._ || [];

const libs = {
	...[
		'recover',
		'upscale',
		'drawDiffMask',
		'checkLog',
		'drawSteps',
		'filterByUUID',
		'getDirectoriesRecursive',
		'expand',
		'debugStream',
		'prepareTimelapse',
		'collectIPAdresses',

		'fixSessionByNickName',
		'filterByIP',
		'calcSessionsWithOneIP',
		'prepareDatabase',
		'filterByBlocked',
		'prepareSessions',
		'geoip',
	].reduce((list, key) => {
		const lib = require(`./${key}`);

		if (typeof lib === 'function') {
			return { ...list, [key]: lib };
		}

		return { ...list, ...lib };
	}, {}),
};

const [command, ...attrs] = argv;

if (libs[command]) {
	libs[command](...attrs);
}

module.exports = libs;
