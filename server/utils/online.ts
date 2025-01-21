import { getOnlineCountList as getOnlineList } from './ws';
import { getUserData } from './auth';

const CACHE_DURATION = 5_000;

let onlineCache: any[] = [];
let onlineCountCache = 0;
let onlineCacheTime = 0;

export const getOnlineCountList = (limit = Infinity) => {
	let onlineCount = limit;
	
	if ((Date.now() - onlineCacheTime) > CACHE_DURATION) {
		const onlineCountList = getOnlineList();
		const online = new Map();

		onlineCacheTime = Date.now();
	
		onlineCountList.forEach((item) => {
			if (online.size < limit) {
				const { area, name }: any = getUserData(item.uuid);
	
				online.set(`${area}:${name}`, { area, name });
			} else {
				onlineCount++;
			}
		});
	
		if (onlineCount === limit && online.size < limit) {
			onlineCount = online.size;
		}

		onlineCache = Array.from(online, ([, item]) => item);
        onlineCountCache = onlineCount;
	}

    return {
        onlineList: onlineCache,
        onlineCount: onlineCountCache,
    };
};
