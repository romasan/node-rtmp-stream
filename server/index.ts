import fs from 'fs';
import { initStreamCanvas, saveCanvas, getImageBuffer } from './utils/canvas';
import { initStats } from './utils/stats';
import { expandsInit } from './utils/expands';
import { initServer } from './utils/ws';
import { webServerHandler } from './api';

const { stream } = require('./config.json');

initStreamCanvas();

expandsInit();
initStats();

if (stream.enable) {
	require('./utils/stream');
}

if (stream.file && stream.interval) {
	setInterval(() => {
		fs.writeFileSync(stream.file, getImageBuffer());
	}, Number(stream.interval));
}

initServer(webServerHandler);

setInterval(saveCanvas, 60 * 1000);
