import React, { useState, useEffect } from 'react';

import mobile from 'is-mobile';

import { Canvas } from './components/Canvas';
import { Palette } from './components/Palette';
import { Modal } from './components/Modal';

import { addPix } from './lib/api';
import ee from './lib/ee';

// import twitch from 'url:./res/twitch.svg';
// import vkplay from 'url:./res/vkplay.svg';
import discord from 'url:./res/discord.svg';

import s from './App.module.scss';

export const App: React.FC = () => {
	const [showed, toggle] = useState(false);
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');

	const isMobile = mobile();

	useEffect(() => {
		if (!color && wsStore?.environment?.palette) {
			const firstColor = 'black' in wsStore?.environment?.palette ? 'black' : (Object.keys(wsStore?.environment?.palette) || []).pop();
			setColor(firstColor as string);
		}
	}, [color, wsStore]);

	const handleCanvasClick = (x: number, y: number) => {
		addPix({ x, y, color });
	}

	const handleOpenChatClick = () => {
		window.open('https://vkplay.live/pixel_battle/only-chat', '', `width=500,height=500,left=${window.innerWidth / 2 - 250},top=${window.innerHeight / 2 - 250}`);
	}

	useEffect(() => {
		ee.on('ws:environment', (payload) => {
			setWsStore((store = {}) => ({ ...store, environment: payload }));
		});
	}, []);

	return (
		<div className={isMobile ? 'mobile' : ''}>
			<Canvas color={wsStore?.environment?.palette[color]} onClick={handleCanvasClick} />
			{wsStore?.environment?.palette && (
				<Palette color={color} colors={wsStore?.environment?.palette} setColor={setColor} />
			)}
			{showed && (
				<Modal onClose={() => toggle(false)}>
					<div className={s.joinModalContent}>
						<div>Чтобы присоединиться к PIXEL BATTLE</div>
						<div>напиши свой ник на VK Play</div>
						<div><input type="text" className={s.input} placeholder="nickname" /></div>
						<div>и отправь в чат стрима <span className={s.command}>!join</span></div>
						<button onClick={handleOpenChatClick} className={s.button}>ОТКРЫТЬ ЧАТ</button>
					</div>
				</Modal>
			)}
			<div className={s.footer}>
				{/* <a href="https://vkplay.live/place_ru" target="_blank">
					<img src={vkplay} />
				</a> */}
				{/* <a href="https://www.twitch.tv/place_ru" target="_blank">
					<img src={twitch} />
				</a> */}
				<a href="https://discord.gg/DC44V22y" target="_blank">
					<img src={discord} />
				</a>
			</div>
		</div>
	)
}
