import './utils/db';
import { initStreamCanvas, saveCanvas } from './utils/canvas';
import { initStats } from './utils/stats';
import { expandsInit } from './utils/expands';
import { initServer } from './utils/ws';
import { webServerHandler } from './api';

initStreamCanvas();

initStats();
expandsInit();

initServer(webServerHandler);

setInterval(saveCanvas, 60 * 1000);
