import { IncomingMessage, ServerResponse } from 'http';
import { getStats } from '../../utils/stats';
import { parseCookies } from '../../helpers';
import { checkSession } from '../../utils/sessions';
import { checkIsAdmin } from '../../utils/auth';
import { stats } from './stats';
import { streamSettings } from './streamSettings';
import { updateFreezedFrame } from './updateFreezedFrame';
import { fillSquare } from './fillSquare';
import { onlineList } from './onlineList';
import { pixel } from './pixel';
import { ban } from './ban';
import { unban } from './unban';
import { getBans } from './getBans';
import {
	heatmap,
	newestmap,
	newestmapByIndex,
	usersmap,
	lastPixels,
	byIP,
	byTime,
} from './maps';
import { chat } from './chat';
import { countdown } from './countdown';
import { user } from './user';
import { expand } from './expand';
import { pause } from './pause';

const getHistory = (req: IncomingMessage, res: ServerResponse) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getStats().history));
};

let routes: Record<string, any> = {
	'stats': stats,
	'streamSettings': streamSettings,
	'updateFreezedFrame': updateFreezedFrame,
	'fillSquare': fillSquare,
	'onlineList': onlineList,
	'pixel': pixel,
	'ban': ban,
	'unban': unban,
	'getBans': getBans,
	'heatmap.png': heatmap,
	'newestmap.png': newestmap,
	'newestmapByIndex.png': newestmapByIndex,
	'usersmap.png': usersmap,
	'lastPixels.png': lastPixels,
	'byIP.png': byIP,
	'byTime.png': byTime,
	'history': getHistory,
	'chat': chat,
	'countdown': countdown,
	'user': user,
	'expand': expand,
	'pause': pause,
};

routes = Object.entries(routes).reduce((list, [key, callback]) => ({
	...list,
	[`/admin/${key}`]: callback,
}), {});

const index = async (req: IncomingMessage, res: ServerResponse, {
	getInfo,
}: {
	getInfo: (req: IncomingMessage, res: ServerResponse) => void;
}) => {
	const { token } = parseCookies(req.headers.cookie || '');

	if (
		!checkSession(token) ||
		!checkIsAdmin(token)
	) {
		getInfo(req, res);

		return;
	}

	const reqUrl = req.url?.split('?')[0] as string;

	if (routes[reqUrl]) {
		routes[reqUrl](req, res);

		return;
	}

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end('{}');
};

export default index;
