import React, { useState } from 'react';

import s from './App.module.scss';

import { Canvas } from './components/Canvas';
import { Modal } from './components/Modal';
import { Palette } from './components/Palette';

import { sendMessage } from './ws';

export const App: React.FC = () => {
	const [showed, toggle] = useState(true);

	const handleCanvasClick = (x: number, y: number) => {
		// toggle(true);
		console.log(`==== handleCanvasClick ${x} ${y}`);
		sendMessage({
			event: 'pushPix',
			payload: {
				x,
				y,
				color: 'red',
			},
		});
	}

	const handleOpenChatClick = () => {
		window.open('https://vkplay.live/pixel_battle/only-chat', '', 'width=500,height=500');
	}

	return (
		<div className={s.root}>
			<Canvas onClick={handleCanvasClick} />
			<Palette />
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
		</div>
	)
}
