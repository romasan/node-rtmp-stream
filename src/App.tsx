import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';

import mobile from 'is-mobile';

import {
	Canvas,
	Palette,
	Chat,
	Info,
	Countdown,
} from './components/';

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
import info from 'url:../res/info.svg';

import * as s from './App.module.scss';

const disableMouse = {
	onMouseDown: (e: MouseEvent) => e.stopPropagation(),
	onMouseMove: (e: MouseEvent) => e.stopPropagation(),
	onMouseUp: (e: MouseEvent) => e.stopPropagation(),
};

export const App: React.FC = () => {
	const [wsStore, setWsStore] = useState<any>({
		name: '',
		palette: null,
	});
	const [color, setColor] = useState('');
	const [chatIsShowed, setChatIsShowed] = useState(false);
	const [infoIsShowed, setInfoIsShowed] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [expiration, setExpiration] = useState(0);
	const [isOnline, setIsOnline] = useState(false);
	const [blinkedLoginAnimation, setBlinkedLoginAnimation] = useState(false);
	const [finish, setFinish] = useState(0);
	const [isFinished, setIsFinished] = useState(false);
	const [hasNewMessage, setHasNewMessage] = useState(false);
	const blinkedTimer = useRef<number | NodeJS.Timeout>(-1);

	const toggleChat = () => {
		setHasNewMessage(false);
		setChatIsShowed((value) => !value);
	};

	const toggleInfo = () => {
		setInfoIsShowed((value) => !value);
	};

	const isMobile = mobile();

	useEffect(() => {
		if (!color && wsStore.palette && wsStore.palette) {
			const firstColor = 'black' in wsStore.palette
				? 'black'
				: (Object.keys(wsStore.palette) || []).pop();

			setColor(firstColor as string);
		}
	}, [color, wsStore]);

	useEffect(() => {
		if (finish) {
			const timer = setInterval(() => {
				if (finish <= Date.now()) {
					setIsFinished(true);
					clearInterval(timer);
				}
			}, 1000);
	
			return () => {
				clearInterval(timer);
			};
		}

	}, [finish]);

	const handleCanvasClick = (x: number, y: number) => {
		addPix({ x, y, color });
	};

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

	const onPix = (payload: string) => {
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

	const handleChatMessage = (message: any) => {
		if (wsStore.name && message.text.indexOf(`@${wsStore.name}`) >= 0) {
			setHasNewMessage(true);
		}
	};

	useEffect(() => {
		ee.on('ws:init', onWsInit);
		ee.on('ws:countdown', onWsCountdown);
		ee.on('pix', onPix);
		ee.on('ws:connect', onWsConnect);
		ee.on('ws:chatMessage', handleChatMessage);

		return () => {
			ee.off('ws:init', onWsInit);
			ee.off('ws:countdown', onWsCountdown);
			ee.off('pix', onPix);
			ee.off('ws:connect', onWsConnect);
		};
	}, [isAuthorized]);

	return (
		<div className={cn(s.root, { mobile: isMobile })}>
			<div className={s.header} {...disableMouse}>
				<div className={s.title}>
					<h1>PIXEL BATTLE</h1>
					<h2>Пиксель батл 2023 S1E2</h2>
				</div>
				<div className={s.controls}>
					{isAuthorized ? (
						<>
							<div className={s.userName}>
								{wsStore.name}
							</div>
							<a href="/logout" className={cn({ [s.disabled]: !isOnline })}>
								<img src={logout} className={s.iconButton} alt="Выход" />
							</a>
						</>
					) : (
						<a href="/login" className={cn({ [s.disabled]: !isOnline, [s.blinked]: blinkedLoginAnimation })}>
							<img src={login} className={s.iconButton} alt="Авторизация" />
						</a>
					)}
					<span className={cn(s.iconWrapper, { [s.badge]: hasNewMessage && !chatIsShowed })}>
						<img src={chat} onClick={toggleChat} className={s.iconButton} alt="Чат" />
					</span>
					<img src={info} onClick={toggleInfo} className={cn(s.iconButton, { [s.disabled]: !isOnline })} alt="Статистика" />
				</div>
			</div>
			<Canvas
				color={wsStore.palette ? wsStore.palette[color] : ''}
				onClick={handleCanvasClick}
				expiration={expiration}
				isAuthorized={isAuthorized}
				isFinished={isFinished}
				isOnline={isOnline}
			/>
			{wsStore.palette && !isFinished && (
				<Palette color={color} colors={wsStore.palette} setColor={setColor} expiration={expiration} />
			)}
			{Boolean(finish) && (
				<Countdown finish={finish} text={wsStore.finishText}/>
			)}
			<div className={s.footer} {...disableMouse}>
				<a href="https://vkplay.live/place_tv" target="_blank" rel="noreferrer">
					<img src={vkplay} alt="Стрим в VKPlay Live" />
				</a>
				<a href="https://www.twitch.tv/place_ru" target="_blank" rel="noreferrer">
					<img src={twitch} alt="Стрим в Twitch" />
				</a>
				<a href="https://www.youtube.com/@Place-ru" target="_blank" rel="noreferrer">
					<img src={youtube} alt="Записи таймпапс в Youtube" />
				</a>
				<a href="https://discord.gg/FfVjurYrus" target="_blank" rel="noreferrer">
					<img src={discord} alt="Discord сервер пиксель батла" />
				</a>
				<a href="https://t.me/pixel_battle_online" target="_blank" rel="noreferrer">
					<img src={telegram} alt="Telegram канал пиксель батла"/>
				</a>
			</div>
			{chatIsShowed && (
				<Chat
					isAuthorized={isAuthorized}
					nickname={wsStore.name}
					onClose={toggleChat}
					{...disableMouse}
				/>
			)}
			{infoIsShowed && (
				<Info {...disableMouse} onClose={toggleInfo} />
			)}
		</div>
	);
};
