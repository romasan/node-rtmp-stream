import { useState, useEffect } from 'react';

import ee from '../lib/ee';

export enum ERole {
	'user',
	'moderator',
}

export const useWsStore = (): {
	wsStore: any;
	isAuthorized: boolean;
	expiration: number;
	isOnline: boolean;
	finish: number;
	hasNewMessage: boolean;
	role: ERole;
	paused: boolean;
	setHasNewMessage: (value: boolean) => void;
} => {
	const [wsStore, setWsStore] = useState<any>({
		name: '',
		palette: null,
	});
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [expiration, setExpiration] = useState(0);
	const [isOnline, setIsOnline] = useState(false);
	const [role, setRole] = useState<ERole>(ERole.user);
	const [finish, setFinish] = useState(0);
	const [paused, setPaused] = useState(false);
	const [hasNewMessage, setHasNewMessage] = useState(false);

	const onWsInit = (payload: any) => {
		setWsStore((store = {}) => ({ ...store, ...payload }));
		setExpiration(Date.now() + payload.countdown);
		setIsAuthorized(payload.isAuthorized);
		setPaused(payload.paused);

		if (payload.finish !== 'newer') {
			setFinish(Date.now() + payload.finish);
		}
	};

	const onWsCountdown = (countdown: number) => {
		setWsStore((store = {}) => ({ ...store, countdown }));
		setExpiration(Date.now() + countdown);
	};

	const onWsConnect = (payload: boolean | string) => {
		setIsOnline(Boolean(payload));
		setRole(payload === 'qq' ? ERole.moderator : ERole.user);
	};

	const handleChatMessage = (message: any) => {
		if (wsStore.name && message.text.indexOf(`@${wsStore.name}`) >= 0) {
			setHasNewMessage(true);
		}
	};

	const handlePlayPause = (value: boolean) => {
		setPaused(value);
	};

	const handleExpand = (payload: any) => {
		setWsStore((store = {}) => ({ ...store, canvas: payload }));
	};

	useEffect(() => {
		ee.on('ws:init', onWsInit);
		ee.on('ws:countdown', onWsCountdown);
		ee.on('ws:connect', onWsConnect);
		ee.on('ws:chatMessage', handleChatMessage);
		ee.on('ws:pause', handlePlayPause);
		ee.on('ws:expand', handleExpand);

		return () => {
			ee.off('ws:init', onWsInit);
			ee.off('ws:countdown', onWsCountdown);
			ee.off('ws:connect', onWsConnect);
			ee.off('ws:chatMessage', handleChatMessage);
			ee.off('ws:pause', handlePlayPause);
			ee.off('ws:expand', handleExpand);
		};
	}, [isAuthorized]);

	return {
		wsStore,
		isAuthorized,
		expiration,
		isOnline,
		finish,
		hasNewMessage,
		role,
		paused,
		setHasNewMessage,
	};
};
