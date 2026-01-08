import { useRef, useState, useEffect } from 'react';
import { useWsStore } from './useWsStore';
import { useMobileLayout } from './useMobileLayout';
import { doOnEnter, life } from '../helpers';
import ee from '../lib/ee';
import { colorSchemes } from '../../server/constants/colorSchemes';
import { EMode } from '../components';

export const useApp = () => {
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

	// Инициализация цвета
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

	// Обработка завершения времени
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

	// Обработка клика по холсту
	const handleCanvasClick = (x: number | string, y: number) => {
		if (canvasMode === EMode.PICK) {
			setPickedColor(x as string);
			setCanvasMode(EMode.CLICK);
			return;
		}

		// Обработка авторизации будет зависеть от контекста вызова
		// В каждом компоненте реализуется по-своему
	};

	// Обработка выбора цвета
	const handlePick = (value?: boolean): void => {
		if (typeof value === 'boolean') {
			setPickedColor('');
			setCanvasMode(value ? EMode.PICK : EMode.CLICK);
		} else {
			setCanvasMode((v: EMode) => v === EMode.PICK ? EMode.CLICK : EMode.PICK);
		}
	};

	// Обработка события pix
	const onPix = (payload: string) => {
		if (payload === 'await' && !isAuthorized) {
			setBlinkedLoginAnimation(true);
			clearTimeout(blinkedTimer.current);
			blinkedTimer.current = setTimeout(() => {
				setBlinkedLoginAnimation(false);
			}, 3000);
		}
	};

	// Подписка на событие pix
	useEffect(() => {
		ee.on('pix', onPix);

		return () => {
			ee.off('pix', onPix);
		};
	}, [isAuthorized]);

	// Обработка жизни (life)
	useEffect(() => {
		const breakDo = doOnEnter('life', () => {
			life(canvas.image);
		});

		return breakDo;
	}, [canvas]);

	// Обработка изменения размера окна
	useEffect(() => {
		const callback = () => {
			canvas && canvas.centering();
		};

		window.addEventListener('resize', callback);

		return () => {
			window.removeEventListener('resize', callback);
		};
	}, [canvas]);

	return {
		color,
		setColor,
		pickedColor,
		setPickedColor,
		blinkedLoginAnimation,
		isFinished,
		setIsFinished,
		canvas,
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
		handleCanvasClick,
		handlePick,
		onPix
	};
};
