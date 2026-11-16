import './utils/db';
import {
    initStreamCanvas,
    saveCanvas,
    initStats,
    expandsInit,
    initServer,
} from './utils';
import { webServerHandler } from './api';

initStreamCanvas();

initStats();
expandsInit();

initServer(webServerHandler);

setInterval(saveCanvas, 60 * 1000);
