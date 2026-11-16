import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { getSessionsByNick, getUserData, getUserByToken } from '../../utils';
import { getSearch, getAllSessions } from '../../helpers';

const byToken = (req: IncomingMessage, res: ServerResponse) => {
	const { query } = getSearch(req.url as string) as any;

	const user = getUserData(query);
	const userRAW = getUserByToken(query);

	let table: string[][] = getAllSessions(query);
	const IPs = Object.keys(
		table
			.reduce((list, [date, ip]) => ({ ...list, [ip]: true }), {})
	);

	const payload = {
		user: {
			parsed: user,
			raw: userRAW?.data?.[0],
		},
		session: {
			// table,
			total: table.length,
			IPs,
			firstLogin: table[0][0],
			lastLogin: table[table.length - 1][0],
		},
		type: 'token',
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};

const byNick = (req: IncomingMessage, res: ServerResponse) => {
	const { query } = getSearch(req.url as string) as any;

	const payload = {
		query,
		type: 'nick',
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};

export const user = (req: IncomingMessage, res: ServerResponse) => {
	if (req.url?.includes('/token')) {
		byToken(req, res);

		return;
	}

	if (req.url?.includes('/nick')) {
		byNick(req, res);

		return;
	}

	const query: any = url.parse(req.url as string, true).query;
	const uuids = getSessionsByNick(query.nick);

	const payload = {
		uuids,
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};
