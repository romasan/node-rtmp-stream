const url = require('url');
const { getStats } = require('../../utils/canvas');
const {
	heatmapFromStats,
	mapByUsersFromStats,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
} = require('../../utils/maps');

const heatmap = async (req, res) => {
	const heatmapCanvas = await heatmapFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(heatmapCanvas.toBuffer());
};

const newestmap = async (req, res) => {
	const newestCanvas = await heatmapNewestFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(newestCanvas.toBuffer());
};

const usersmap = async (req, res) => {
	const usersCanvas = await mapByUsersFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(usersCanvas.toBuffer());
};

const lastPixels = async (req, res) => {
	const query = url.parse(req.url, true).query;
	const lastPixelsCanvas = await mapLastPixelsFromStats(getStats(), query.count);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(lastPixelsCanvas.toBuffer());
};

module.exports = {
	heatmap,
	newestmap,
	usersmap,
	lastPixels,
};
