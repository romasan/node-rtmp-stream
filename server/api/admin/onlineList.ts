import { IncomingMessage, ServerResponse } from 'http';
import { getOnlineCountList } from '../../utils/ws';
import { getUserData } from '../../utils/auth';
import { getSessionUserName } from '../../utils/sessions';

export const onlineList = (req: IncomingMessage, res: ServerResponse) => {
	const list = getOnlineCountList().map((item) => {
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
