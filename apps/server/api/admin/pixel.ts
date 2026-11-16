import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { getSearch, getAllSessions } from '../../helpers';
import {
	getPixelAuthor,
	getPixelAuthorIPAddress,
	getPixelColor,
} from '../../utils/stats';
import { getUserData } from '../../utils/auth';

export const pixel = (req: IncomingMessage, res: ServerResponse) => {
	const { x, y } = getSearch(req.url as string) as any;
	const { area, nickname, uuid, time } = getPixelAuthor(x, y);
	const pixelUser: any = getUserData(uuid);
	const ip = getPixelAuthorIPAddress(x, y);

	// const errors = [];

	let table: string[][] = getAllSessions(uuid);

	const _payload: any = {
		x,
		y,
		uuid,
		time,
		color: getPixelColor(x, y),
		area,
		name: nickname,
		user: pixelUser,
		logins: table,
		ip,
	};

	// if (errors.length) {
	// 	_payload.errors = errors;
	// }

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(_payload));
};
