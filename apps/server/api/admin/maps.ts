import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import {
	getStats,
	heatmapFromStats,
	mapByUsersFromStats,
	heatmapNewestByIndex,
	heatmapNewestFromStats,
	mapLastPixelsFromStats,
	mapByIP,
	mapByTime,
} from '../../utils';

export const heatmap = (req: IncomingMessage, res: ServerResponse) => {
	const heatmapCanvas = heatmapFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(heatmapCanvas.toBuffer());
};

export const newestmap = (req: IncomingMessage, res: ServerResponse) => {
	const newestCanvas = heatmapNewestFromStats(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(newestCanvas.toBuffer());
};

export const newestmapByIndex = (req: IncomingMessage, res: ServerResponse) => {
	const newestCanvas = heatmapNewestByIndex(getStats());

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(newestCanvas.toBuffer());
};

export const usersmap = (req: IncomingMessage, res: ServerResponse) => {
	const query = url.parse(String(req.url), true).query;
	const usersCanvas = mapByUsersFromStats(getStats(), query.uuid as string);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(usersCanvas.toBuffer());
};

export const lastPixels = (req: IncomingMessage, res: ServerResponse) => {
	const query = url.parse(String(req.url), true).query;
	const lastPixelsCanvas = mapLastPixelsFromStats(getStats(), Number(query.count || 0));

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(lastPixelsCanvas.toBuffer());
};

export const byIP = (req: IncomingMessage, res: ServerResponse) => {
	const query = url.parse(String(req.url), true).query;
	const pixelsByCanvas = mapByIP(getStats(), query.ip as string);

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(pixelsByCanvas.toBuffer());
};

export const byTime = (req: IncomingMessage, res: ServerResponse) => {
	const query = url.parse(String(req.url), true).query;
	const pixelsByCanvas = mapByTime(getStats(), Number(query.time));

	res.writeHead(200, { 'Content-Type': 'image/png' });
	res.end(pixelsByCanvas.toBuffer());
};
