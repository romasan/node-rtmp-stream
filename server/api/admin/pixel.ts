import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { getSearch, getPathByToken } from '../../helpers';
import {
	getPixelAuthor,
	getPixelAuthorIPAddress,
	getPixelColor,
} from '../../utils/stats';
import { getUserData } from '../../utils/auth';
import { getSessionUserName } from '../../utils/sessions';

export const pixel = (req: IncomingMessage, res: ServerResponse) => {
	const { x, y } = getSearch(req.url as string) as any;
	const { uuid, time } = getPixelAuthor(x, y);
	const pixelUser: any = getUserData(uuid);
	const name = pixelUser?.name || getSessionUserName(uuid);
	const ip = getPixelAuthorIPAddress(x, y);

	const errors = [];

	const filePath = getPathByToken(uuid, false);
	let table: string[][] = [];

	try {
		const file = fs.readFileSync(filePath).toString();

		table = file
			.split('\n')
			.filter(Boolean)
			.map((line) => line.split(';'));
	} catch(ignore) {
		errors.push(`Error read file: ${filePath}`);
	}

	const _payload: any = {
		x,
		y,
		uuid,
		time,
		color: getPixelColor(x, y),
		name,
		user: pixelUser,
		logins: table,
		ip,
	};

	if (errors.length) {
		_payload.errors = errors;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(_payload));
};
