import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';

import mobile from 'is-mobile';

import {
	Canvas,
	Palette,
	Modal,
	Chat,
} from './components/'

import { addPix } from './lib/api';
import ee from './lib/ee';

import twitch from 'url:../res/twitch.svg';
import vkplay from 'url:../res/vkplay.svg';
import youtube from 'url:../res/youtube.svg';
import discord from 'url:../res/discord.svg';
import telegram from 'url:../res/telegram.svg';
import chat from 'url:../res/chat.svg';
import login from 'url:../res/login.svg';
import logout from 'url:../res/logout.svg';

import * as s from './App.module.scss';

const disableMouse = {
	onMouseDown: (e: MouseEvent) => e.stopPropagation(),
	onMouseMove: (e: MouseEvent) => e.stopPropagation(),
	onMouseUp: (e: MouseEvent) => e.stopPropagation(),
};

export const App: React.FC = () => {
	const [showed, toggle] = useState(false);
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');
	const [chatIsShowed, setChatIsShowed] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [expiration, setExpiration] = useState(0);
	const [isOnline, setIsOnline] = useState(false);
	const [blinkedLoginAnimation, setBlinkedLoginAnimation] = useState(false);
	const blinkedTimer = useRef(-1);

	const toggleChat = () => {
		setChatIsShowed((value) => !value);
	};

	const isMobile = mobile();

	useEffect(() => {
		if (!color && wsStore?.palette) {
			const firstColor = 'black' in wsStore?.palette
				? 'black'
				: (Object.keys(wsStore?.palette) || []).pop();

			setColor(firstColor as string);
		}
	}, [color, wsStore]);

	const handleCanvasClick = (x: number, y: number) => {
		addPix({ x, y, color });
	}

	const handleOpenChatClick = () => {
		window.open('https://vkplay.live/pixel_battle/only-chat', '', `width=500,height=500,left=${window.innerWidth / 2 - 250},top=${window.innerHeight / 2 - 250}`);
	};

	const handleTwitchLoginClick = () => {
		const { hostname, protocol } = document.location;
		const APIhost = `${protocol}//${hostname === 'localhost' ? '' : 'api.'}${hostname.replace('www.', '')}:8080`;
		// window.open(`${APIhost}/auth/twitch`, '', `width=500,height=500,left=${window.innerWidth / 2 - 250},top=${window.innerHeight / 2 - 250}`);
		document.location.href = `${APIhost}/auth/twitch`;
	};

	const onWsInit = (payload: any) => {
		setWsStore((store = {}) => ({ ...store, ...payload }));
		setExpiration(Date.now() + payload?.countdown);
		setIsAuthorized(payload?.isAuthorized);
	};

	const onWsCountdown = (countdown: number) => {
		setWsStore((store = {}) => ({ ...store, countdown }));
		setExpiration(Date.now() + countdown);
	};

	const onWsPix = (payload: string) => {
		if (payload === 'await' && !isAuthorized) {
			setBlinkedLoginAnimation(true);
			clearTimeout(blinkedTimer.current);
			blinkedTimer.current = setTimeout(() => {
				setBlinkedLoginAnimation(false);
			}, 3000);
		}
	};

	const onWsConnect = (payload: boolean) => {
		setIsOnline(payload);
	};

	useEffect(() => {
		ee.on('ws:init', onWsInit);
		ee.on('ws:countdown', onWsCountdown);
		ee.on('ws:pix', onWsPix);
		ee.on('ws:connect', onWsConnect);

		return () => {
			ee.off('ws:init', onWsInit);
			ee.off('ws:countdown', onWsCountdown);
			ee.off('ws:pix', onWsPix);
			ee.off('ws:connect', onWsConnect);
		};
	}, [isAuthorized]);

	return (
		<div className={isMobile ? 'mobile' : ''}>
			<div className={s.header} {...disableMouse}>
				{isAuthorized ? (
					<>
						<div className={s.userName}>
							{wsStore?.name}
						</div>
						<a href="/logout" className={cn({ [s.disabled]: !isOnline })}>
							<img src={logout} className={s.iconButton} />
						</a>
					</>
					) : (
						<a href="/login" className={cn({ [s.disabled]: !isOnline, [s.blinked]: blinkedLoginAnimation })}>
							<img src={login} className={s.iconButton} />
						</a>
				)}
				<img src={chat} onClick={toggleChat} className={s.iconButton} />
			</div>
			<Canvas
				color={wsStore?.palette?.[color]}
				onClick={handleCanvasClick}
				expiration={expiration}
				isAuthorized={isAuthorized}
			/>
			{wsStore?.palette && (
				<Palette color={color} colors={wsStore?.palette} setColor={setColor} expiration={expiration} />
			)}
			{showed && (
				<Modal onClose={() => toggle(false)}>
					<div className={s.joinModalContent}>
						<div>Чтобы присоединиться к PIXEL BATTLE</div>
						<div>напиши свой ник на VK Play</div>
						<div><input type="text" className={s.input} placeholder="nickname" /></div>
						<div>и отправь в чат стрима <span className={s.command}>!join</span></div>
						<button onClick={handleOpenChatClick} className={s.button}>ОТКРЫТЬ ЧАТ</button>
						<button onClick={handleTwitchLoginClick} className={s.button}>Залогинься через Twitch</button>
						<div>или</div>
						<button onClick={handleTwitchLoginClick} className={s.button}>Залогинься через ВК</button>
					</div>
				</Modal>
			)}
			<div className={s.footer} {...disableMouse}>
				<a href="https://vkplay.live/place_tv" target="_blank">
					<img src={vkplay} />
				</a>
				<a href="https://www.twitch.tv/place_ru" target="_blank">
					<img src={twitch} />
				</a>
				<a href="https://www.youtube.com/@Place-ru" target="_blank">
					<img src={youtube} />
				</a>
				{/* <a href="https://discord.gg/FfVjurYrus" target="_blank">
					<img src={discord} />
				</a> */}
				<a href="https://t.me/pixel_battle_online" target="_blank">
					<img src={telegram} />
				</a>
			</div>
			{chatIsShowed && (
				<Chat isAuthorized={isAuthorized} {...disableMouse} />
			)}
		</div>
	)
}
