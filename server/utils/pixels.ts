/**
 * сохраниение поставленных пикселей
 */

import fs from 'fs';
import { IPixel } from '../types';

const pixelsFile = fs.createWriteStream(__dirname + '/../../db/pixels.log', { flags : 'a' });

export const pixelsLog = ({ x, y, color, area, uuid, ip, nickname }: IPixel) => {
	pixelsFile.write([Date.now(), area, x, y, color, uuid, ip, nickname].join(';') + '\n');
};
