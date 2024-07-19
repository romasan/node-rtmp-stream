const url = require('url');
const { getStats } = require('../../utils/stats');
const {
	heatmapFromStats,
	mapByUsersFromStats,
	heatmapNewestByIndex,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
	mapByIP,
	mapByTime,
} = require('../../utils/maps');

const heatmap = (req, res) => {
	const heatmapCanvas = heatmapFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(heatmapCanvas.toBuffer());
};

const newestmap = (req, res) => {
	const newestCanvas = heatmapNewestFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(newestCanvas.toBuffer());
};

const newestmapByIndex = (req, res) => {
	const newestCanvas = heatmapNewestByIndex(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(newestCanvas.toBuffer());
};

const usersmap = (req, res) => {
	const query = url.parse(req.url, true).query;
	const usersCanvas = mapByUsersFromStats(getStats(), query.uuid);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(usersCanvas.toBuffer());
};

const lastPixels = (req, res) => {
	const query = url.parse(req.url, true).query;
	const lastPixelsCanvas = mapLastPixelsFromStats(getStats(), query.count);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(lastPixelsCanvas.toBuffer());
};

const byIP = (req, res) => {
	const query = url.parse(req.url, true).query;
	const pixelsByCanvas = mapByIP(getStats(), query.ip);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(pixelsByCanvas.toBuffer());
};

const byTime = (req, res) => {
	const query = url.parse(req.url, true).query;
	const pixelsByCanvas = mapByTime(getStats(), query.time);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(pixelsByCanvas.toBuffer());
};

module.exports = {
	heatmap,
	newestmap,
	newestmapByIndex,
	usersmap,
	lastPixels,
	byIP,
	byTime,
};
