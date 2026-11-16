import { IncomingMessage, ServerResponse } from 'http';
import {
	getTotalPixels,
	getTopLeaderboard,
	getUserData,
	getOnlineCountList,
	getToken,
} from '../utils';

export const stats = (req: IncomingMessage, res: ServerResponse) => {
	const token = getToken(req);
	const user: any = getUserData(token);
	const total = getTotalPixels();
	const leaderboard = getTopLeaderboard(10, user.name, user.area);
	const { onlineCount, onlineList } = getOnlineCountList(100);

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({
		total,
		leaderboard,
		onlineCount,
		onlineList,
	}));
};
