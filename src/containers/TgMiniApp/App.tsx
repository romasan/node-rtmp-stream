import React, { useEffect, useRef } from 'react';

import cn from 'classnames';

import {
	Canvas,
	Palette,
	HeaderLogo,
	HeaderControls,
	Countdown,
	EMode,
} from '../../components/';

import { addPix, APIhost, authTgMiniApp } from '../../lib/api';

import { useApp } from '../../hooks/useApp';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const blinkedTimer = useRef<number | NodeJS.Timeout>(-1);

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

	useEffect(() => {
		if (wsStore.needAuthorize && !isAuthorized) {
			authTgMiniApp()
				.then((text) => {
					if (text === 'success') {
						// alert('успешный вход');

						document.location.reload();

						return;
					}

					// alert('ошибка входа #1');
				})
				.catch(() => {
					// alert('ошибка входа #2');
				});
		}
	}, [isAuthorized, wsStore]);

	// Обновим обработчик клика для TgMiniApp
	const handleCanvasClickTg = (x: number | string, y: number) => {
		if (canvasMode === EMode.PICK) {
			setPickedColor(x as string);
			setCanvasMode(EMode.CLICK);
			return;
		}

		// Для TgMiniApp не нужна логика авторизации, она обрабатывается отдельно
		addPix({ x, y, color } as any);
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
					withTimelapse={false}
				/>
				<Canvas
					mode={canvasMode}
					color={(wsStore.canvas && wsStore.canvas.colorScheme === 'truecolor') ? color : palette[color]}
					expand={wsStore.canvas}
					onClick={handleCanvasClickTg}
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
			</div>
		</>
	);
};
