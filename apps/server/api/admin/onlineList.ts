import { IncomingMessage, ServerResponse } from 'http';
import {
	getOnlineCountListWS,
	getUserData,
	getSessionUserName,
} from '../../utils';

export const onlineList = (req: IncomingMessage, res: ServerResponse) => {
	const list = getOnlineCountListWS().map((item) => {
		const user: any = getUserData(item?.uuid);

		return {
			...item,
			name: user?.name || getSessionUserName(item.uuid),
			// ip
			// cooldown
			// address from ip?
		};
	});
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(list));
};
