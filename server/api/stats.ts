import { IncomingMessage, ServerResponse } from 'http';
import { parseCookies } from '../helpers';
import { getTotalPixels, getTopLeaderboard } from '../utils/stats';
import { getUserData } from '../utils/auth';

export const stats = (req: IncomingMessage, res: ServerResponse) => {
	const { token } = parseCookies(req.headers.cookie);
	const user: any = getUserData(token);
	const total = getTotalPixels();
	const leaderboard = getTopLeaderboard(10, user.name, user.area);

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({
		total,
		leaderboard,
	}));
};
