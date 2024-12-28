import path from 'path';
import fs from 'fs';
import { Log } from '../utils/log';

export const addSessionForIP = (ip: string, token: string, time = Date.now()) => {
	if (ip === '::1') {
		ip = '127.0.0.1';
	}

	const _ip: string = ip.split(':').pop() || '';
	const [a, b] = _ip.split('.');

	if (!a || !b) {
		Log('Error: failed parse IP', ip);

		return;
	}

	const filePath = `${__dirname}/../../db/sessions/network/${a}/${_ip}`;
	const dirname = path.dirname(filePath);
	const content = [time, token].join(';') + '\n';

	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
		fs.writeFileSync(filePath, content + '\n');
	} else {
		fs.appendFileSync(filePath, content + '\n');
	}
};
