import React, { useState } from 'react';

import s from './App.module.scss';

import { Canvas } from './components/Canvas';
import { Modal } from './components/Modal';
import { Palette } from './components/Palette';

import { sendMessage } from './ws';

export const App: React.FC = () => {
	const [showed, toggle] = useState(false);

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
					Чтобы присоединиться к PIXEL BATTLE<br />
					напиши свой ник на VK Play<br />
					<input type="text" /><br />
					и в чат стрима отправь команду !join<br />
					<button onClick={handleOpenChatClick}>ОТКРЫТЬ ЧАТ</button>
				</Modal>
			)}
		</div>
	)
}
