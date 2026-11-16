import { IncomingMessage, ServerResponse } from 'http';
import {
	getOnlineCountRaw,
	getOnlineCountUniqUUID,
	getLastActivity,
	getTotalPixels,
	getEmptyPixelSCount,
	getUserData,
	getSessionUserName,
} from '../../utils';

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
	const empty = getEmptyPixelSCount();

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
		empty,
		uptime: Date.now() - startTime,
	};

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
};
