import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';

import {
	Canvas,
	Palette,
	HeaderLogo,
	HeaderControls,
	Countdown,
	EMode,
} from '../../components/';

import { doOnEnter, life } from '../../helpers';

import { addPix, APIhost, authTgMiniApp } from '../../lib/api';
import ee from '../../lib/ee';

import { useWsStore } from '../../hooks/useWsStore';
import { useMobileLayout } from '../../hooks/useMobileLayout';

import { colorSchemes } from '../../../server/constants/colorSchemes';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const [color, setColor] = useState('');
	const [pickedColor, setPickedColor] = useState('');
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

	const isMobile = useMobileLayout();

	const [canvasMode, setCanvasMode] = useState<EMode>('CLICK' as EMode);

	const palette = (colorSchemes as any)[wsStore.canvas && wsStore.canvas.colorScheme] || {};

	useEffect(() => {
		const isTruecolor = (wsStore && wsStore.canvas && wsStore.canvas.colorScheme) === 'truecolor';

		if (!color && palette) {
			const firstColor = ('black' in palette && !isTruecolor)
				? 'black'
				: isTruecolor
					? (Object.values(palette) || []).pop()
					: (Object.keys(palette) || []).pop();

			if (firstColor) {
				setColor(firstColor as string);
			}
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

	const handleCanvasClick = (x: number | string, y: number) => {
		if (canvasMode === EMode.PICK) {
			setPickedColor(x as string);
			setCanvasMode(EMode.CLICK);

			return;
		}

		if (wsStore.needAuthorize && !isAuthorized) {
			// setTimeout(() => {
			// 	loginModal.open();
			// }, 100);
		} else {
			addPix({ x, y, color } as any);
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

	const handlePick = (value?: boolean): void => {
		if (typeof value === 'boolean') {
			setPickedColor('');
			setCanvasMode(value ? EMode.PICK : EMode.CLICK);
		} else {
			setCanvasMode((v) => v === EMode.PICK ? EMode.CLICK : EMode.PICK);
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

	useEffect(() => {
		const callback = () => {
			canvas && canvas.centering();
		};

		window.addEventListener('resize', callback);

		return () => {
			window.removeEventListener('resize', callback);
		};
	}, [canvas]);

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
	}, [isAuthorized, wsStore])

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
					onClick={handleCanvasClick}
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
