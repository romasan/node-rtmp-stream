import React, { useEffect, useRef } from 'react';

import cn from 'classnames';

import {
	Canvas,
	Palette,
	HeaderLogo,
	HeaderControls,
	Countdown,
	Login,
	EMode,
} from './components/';

import { addPix, APIhost } from './lib/api';

import { useApp } from './hooks/useApp';

import { useModal } from './hooks';

import TwitchIcon from '/assets/twitch.svg';
import VkplayIcon from '/assets/vkplay.svg';
import YoutubeIcon from '/assets/youtube.svg';
import DiscordIcon from '/assets/discord.svg';
import TelegramIcon from '/assets/telegram.svg';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const blinkedTimer = useRef<number | NodeJS.Timeout>(-1);

	const loginModal = useModal({
		content: (
			<Login />
		),
		width: '300px',
	});

	const {
		color,
		setColor,
		pickedColor,
		setPickedColor,
		blinkedLoginAnimation,
		isFinished,
		setCanvas,
		wsStore,
		isAuthorized,
		expiration,
		isOnline,
		finish,
		hasNewMessage,
		role,
		paused,
		setHasNewMessage,
		isMobile,
		canvasMode,
		setCanvasMode,
		palette,
		handlePick,
	} = useApp();

	// Обновим обработчик клика для основного приложения
	const handleCanvasClickApp = (x: number | string, y: number) => {
		if (canvasMode === EMode.PICK) {
			setPickedColor(x as string);
			setCanvasMode(EMode.CLICK);
			return;
		}

		if (wsStore.needAuthorize && !isAuthorized) {
			setTimeout(() => {
				loginModal.open();
			}, 100);
		} else {
			addPix({ x, y, color } as any);
		}
	};

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
					mode={canvasMode}
					color={(wsStore.canvas && wsStore.canvas.colorScheme === 'truecolor') ? color : palette[color]}
					expand={wsStore.canvas}
					onClick={handleCanvasClickApp}
					expiration={expiration}
					isAuthorized={isAuthorized}
					isFinished={isFinished}
					isOnline={isOnline}
					onInit={setCanvas}
					src={`${APIhost}/canvas.png`}
				/>
				{isOnline && !isFinished && (
					<Palette
						mode={canvasMode}
						color={color}
						pickedColor={pickedColor}
						colorScheme={wsStore.canvas && wsStore.canvas.colorScheme}
						setColor={setColor}
						onPick={handlePick}
					/>
				)}
				{Boolean(finish) && (
					<Countdown finish={finish} text={wsStore.finishText}/>
				)}
				{paused && (
					<div className={s.paused}>PAUSE ||</div>
				)}
				<div className={s.footer}>
					<a href="https://vkplay.live/place_tv" target="_blank" rel="noreferrer" aria-label="Стрим на VK Play Live">
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
