const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;

const argv = yargs(hideBin(process.argv)).argv?._ || [];
const libs = [
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
];

const getLib = (key) => {
	const lib = require(`./${key}`);

	return lib;
};

const [command, ...attrs] = argv;

if (libs.indexOf(command) >= 0) {
	getLib(command)(...attrs);
}

module.exports = libs;
