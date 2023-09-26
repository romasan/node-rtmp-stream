const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;
const argv = yargs(hideBin(process.argv)).argv?._ || [];

const lib = {
	drawDefaultCanvas: require('./drawDefaultCanvas'),
	recover: require('./recover'),
	upscale: require('./upscale'),
	drawDiffMask: require('./drawDiffMask'),
	checkLog: require('./checkLog'),
	drawSteps: require('./drawSteps'),
	filterByUUID: require('./filterByUUID'),
	getDirectoriesRecursive: require('./getDirectoriesRecursive'),
	getPixelsInfo: require('./getPixelsInfo').getPixelsInfo,
	genMapByUsers: require('./genMapByUsers'),
	heatmap: require('./heatmap'),
	filterByXY: require('./filterByXY'),
	topUUIDs: require('./topUUIDs'),
	// newest pixels heatmap
};

const [command, ...attrs] = argv;

if (lib[command]) {
	lib[command](...attrs);
}

module.exports = lib;
