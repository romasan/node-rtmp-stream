import { IncomingMessage, ServerResponse } from 'http';
import { getOnlineCountRaw, getOnlineCountUniqUUID } from '../../utils/ws';
import { getLastActivity, getTotalPixels } from '../../utils/stats';
import { getUserData } from '../../utils/auth';
import { getSessionUserName } from '../../utils/sessions';

const startTime = Date.now();

export const stats = (req: IncomingMessage, res: ServerResponse) => {
	const [open, all, countByActivity] = getOnlineCountRaw();
	const uniq = getOnlineCountUniqUUID();
	const {
		lastActivity,
		perMin,
		perHour,
	} = getLastActivity() as any;
	const user: any = getUserData(lastActivity?.uuid);
	const total = getTotalPixels();

	const payload = {
		online: {
			uniq,
			open,
			all,
			countByActivity,
		},
		lastActivity: Date.now() - lastActivity?.time,
		perMin,
		perHour,
		lastUserName: user?.name || getSessionUserName(lastActivity?.uuid),
		lastUserUUID: lastActivity.uuid,
		lastUserIP: lastActivity.ip,
		coord: {
			x: lastActivity.x,
			y: lastActivity.y,
		},
		color: lastActivity.color,
		total,
		uptime: Date.now() - startTime,
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};
