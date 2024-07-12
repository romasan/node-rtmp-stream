const fs = require('fs');
const { Log } = require('../utils/log');
const {
	server: {
		timelapseCachePeriod,
	},
} = require('../config.json');

const contentTypes = {
	json: 'application/json',
	bin: 'application/octet-stream',
};

const timelapse = (req, res) => {
	if (req.url.startsWith('/timelapse/')) {
		try {
			const parts = req.url.split('/');
			const [,, season, file] = parts;
			const filePath = `${__dirname}/../../db/archive/${season}/timelapse/${file}`;
			const ext = file?.split('.').pop();

			if (!fs.existsSync(filePath)) {
				throw new Error();
			}

			res.setHeader('Cache-control', `public, max-age=${timelapseCachePeriod}`);
			res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });

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

module.exports = {
	timelapse,
};
