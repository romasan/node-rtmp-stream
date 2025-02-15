import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';

import mobile from 'is-mobile';

import {
	Canvas,
	Palette,
	HeaderLogo,
	HeaderControls,
	Countdown,
	// Bar,
	Login,
} from './components/';

import { doOnEnter, life } from './helpers';

import { addPix, APIhost } from './lib/api';
import ee from './lib/ee';

import { useWsStore } from './hooks/useWsStore';

import TwitchIcon from '/assets/twitch.svg';
import VkplayIcon from '/assets/vkplay.svg';
import YoutubeIcon from '/assets/youtube.svg';
import DiscordIcon from '/assets/discord.svg';
import TelegramIcon from '/assets/telegram.svg';

import { colorSchemes } from '../server/constants/colorSchemes';

import { useModal } from './hooks';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const [color, setColor] = useState('');
	const [blinkedLoginAnimation, setBlinkedLoginAnimation] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const [canvas, setCanvas] = useState<any>({});
	const blinkedTimer = useRef<number | NodeJS.Timeout>(-1);

	const {
		wsStore,
		isAuthorized,
		expiration,
		isOnline,
		finish,
		hasNewMessage,
		role,
		paused,
		setHasNewMessage,
	} = useWsStore();

	const isMobile = mobile();

	const loginModal = useModal({
		content: (
			<Login />
		),
		width: '300px',
	});

	const palette = (colorSchemes as any)[wsStore.canvas && wsStore.canvas.colorScheme] || {};

	useEffect(() => {
		if (!color && palette) {
			const firstColor = 'black' in palette
				? 'black'
				: (Object.keys(palette) || []).pop();

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
		if (wsStore.needAuthorize && !isAuthorized) {
			loginModal.open();
		} else {
			addPix({ x, y, color });
		}
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

	useEffect(() => {
		ee.on('pix', onPix);

		return () => {
			ee.off('pix', onPix);
		};
	}, [isAuthorized]);

	useEffect(() => {
		const breakDo = doOnEnter('life', () => {
			life(canvas.image);
		});

		return breakDo;
	}, [canvas]);

	return (
		<>
			<div className={cn(s.root, { mobile: isMobile })}>
				<HeaderLogo />
				<HeaderControls
					isAuthorized={isAuthorized}
					name={wsStore ? wsStore.name : ''}
					isOnline={isOnline}
					hasNewMessage={hasNewMessage}
					setHasNewMessage={setHasNewMessage}
					blinkedLoginAnimation={blinkedLoginAnimation}
					role={role}
					login={loginModal.open}
				/>
				<Canvas
					color={palette[color] || ''}
					expand={wsStore.canvas}
					onClick={handleCanvasClick}
					expiration={expiration}
					isAuthorized={isAuthorized}
					isFinished={isFinished}
					isOnline={isOnline}
					onInit={setCanvas}
					src={`${APIhost}/canvas.png`}
				/>
				{/* {!isMobile && (
					<Bar
						centering={canvas.centering}
						setScale={canvas.setScale}
						isFinished={isFinished}
					/>
				)} */}
				{isOnline && !isFinished && (
					<Palette color={color} colors={palette} setColor={setColor} />
				)}
				{Boolean(finish) && (
					<Countdown finish={finish} text={wsStore.finishText}/>
				)}
				{paused && (
					<div className={s.paused}>PAUSE ||</div>
				)}
				<div className={s.footer}>
					<a href="https://vkplay.live/place_tv" target="_blank" rel="noreferrer" aria-label="Стрим на VKPlay Live">
						<VkplayIcon />
					</a>
					<a href="https://www.twitch.tv/place_ru" target="_blank" rel="noreferrer" aria-label="Стрим на Twitch">
						<TwitchIcon />
					</a>
					<a href="https://www.youtube.com/@Place-ru" target="_blank" rel="noreferrer" aria-label="Стрим на Twitch">
						<YoutubeIcon />
					</a>
					<a href="https://discord.gg/FfVjurYrus" target="_blank" rel="noreferrer" aria-label="Discord сервер пиксель батла">
						<DiscordIcon />
					</a>
					<a href="https://t.me/pixel_battle_online" target="_blank" rel="noreferrer" aria-label="Telegram канал пиксель батла">
						<TelegramIcon />
					</a>
				</div>
			</div>
			{loginModal.render()}
		</>
	);
};
