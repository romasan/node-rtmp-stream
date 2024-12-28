import { IncomingMessage, ServerResponse } from 'http';
import { parseCookies } from '../helpers';
import { getTotalPixels, getTopLeaderboard } from '../utils/stats';
import { getUserData } from '../utils/auth';
import { getSessionUserName } from '../utils/sessions';

export const stats = (req: IncomingMessage, res: ServerResponse) => {
	const { token } = parseCookies(req.headers.cookie);
	const total = getTotalPixels();
	const leaderboard = getTopLeaderboard(10, token)
		.map((item) => {
			const user: any = getUserData(item.id);

			return {
				name: user?.name || getSessionUserName(item.id),
				count: item.count,
				place: item.place,
				platform: user?.area,
			};
		});

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({
		total,
		leaderboard,
	}));
};
