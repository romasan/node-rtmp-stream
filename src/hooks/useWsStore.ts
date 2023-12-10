import { useState, useEffect } from 'react';

import ee from '../lib/ee';

export const useWsStore = (): {
	wsStore: any;
	isAuthorized: boolean;
	expiration: number;
	isOnline: boolean;
	finish: number;
	hasNewMessage: boolean;
	setHasNewMessage: (value: boolean) => void;
} => {
	const [wsStore, setWsStore] = useState<any>({
		name: '',
		palette: null,
	});
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [expiration, setExpiration] = useState(0);
	const [isOnline, setIsOnline] = useState(false);
	const [finish, setFinish] = useState(0);
	const [hasNewMessage, setHasNewMessage] = useState(false);

	const onWsInit = (payload: any) => {
		setWsStore((store = {}) => ({ ...store, ...payload }));
		setExpiration(Date.now() + payload.countdown);
		setIsAuthorized(payload.isAuthorized);
		if (payload.finish !== 'newer') {
			setFinish(Date.now() + payload.finish);
		}
	};

	const onWsCountdown = (countdown: number) => {
		setWsStore((store = {}) => ({ ...store, countdown }));
		setExpiration(Date.now() + countdown);
	};

	const onWsConnect = (payload: boolean) => {
		setIsOnline(payload);
	};

	const handleChatMessage = (message: any) => {
		if (wsStore.name && message.text.indexOf(`@${wsStore.name}`) >= 0) {
			setHasNewMessage(true);
		}
	};

	useEffect(() => {
		ee.on('ws:init', onWsInit);
		ee.on('ws:countdown', onWsCountdown);
		ee.on('ws:connect', onWsConnect);
		ee.on('ws:chatMessage', handleChatMessage);

		return () => {
			ee.off('ws:init', onWsInit);
			ee.off('ws:countdown', onWsCountdown);
			ee.off('ws:connect', onWsConnect);
		};
	}, [isAuthorized]);

	return {
		wsStore,
		isAuthorized,
		expiration,
		isOnline,
		finish,
		hasNewMessage,
		setHasNewMessage,
	};
};
