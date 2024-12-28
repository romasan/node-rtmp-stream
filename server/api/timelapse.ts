import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { Log } from '../utils/log';

const {
	server: {
		timelapseCachePeriod,
	},
} = require('../config.json');

const contentTypes: any = {
	json: 'application/json',
	bin: 'application/octet-stream',
};

export const timelapse = (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.startsWith('/timelapse/')) {
		try {
			const parts = req.url.split('/');
			const [,, season, file] = parts;
			const filePath = `${__dirname}/../../db/archive/${season}/timelapse/${file}`;
			const ext = file?.split('.').pop();

			if (!fs.existsSync(filePath)) {
				throw new Error();
			}

			res.setHeader('Cache-control', `public, max-age=${timelapseCachePeriod}`);
			res.writeHead(200, { 'Content-Type': contentTypes[ext as string] || 'text/plain' });

			const readStream = fs.createReadStream(filePath);

			readStream.pipe(res);
		} catch (e) {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('fail');

			Log('Error: get timelapse file', req.url, e);
		}

		return true;
	}

	return false;
};
