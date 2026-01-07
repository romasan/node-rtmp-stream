import React, { FC, useRef, useState, useMemo, useCallback, useEffect, PropsWithChildren } from 'react';

import cn from 'classnames';

import ee from '../../lib/ee';
import { WSHost } from '../../lib/ws';
import {
	posIsAbove,
	getInRange,
	hexToRgb,
	rgbToHex,
	invertRgb,
	getPixelColor,
	formatDate,
	formatTime,
	eq,
} from '../../helpers';
import { nickSanitize } from '../../helpers/nickSanitize';
import { getPixel } from '../../lib/api';
import TwitchIcon from '/assets/twitch_bw.svg';
import DiscordIcon from '/assets/discord_bw.svg';
import SteamIcon from '/assets/steam_bw.svg';
import TelegramIcon from '/assets/telegram_bw.svg';
import VkIcon from '/assets/vk_bw.svg';

import { showPixelScale, showPixelScaleMobile, scaleDegree, minScale, maxScale } from '../../const';

import image404 from '/assets/404.webp';

import { EMode, ETouchMode } from './types';

import * as s from './Canvas.module.scss';

const DEBUG = document.location.href.includes('localhost');

const icons = {
	twitch: TwitchIcon,
	discord: DiscordIcon,
	steam: SteamIcon,
	telegram: TelegramIcon,
	vk: VkIcon,
};

interface Props {
	color: string;
	mode?: EMode;
	className?: string;
	expiration?: number;
	isAuthorized?: boolean;
	isFinished?: boolean;
	isOnline?: boolean;
	src?: string;
	viewOnly?: boolean;
	expand?: {
		width: number;
		height: number;
		shiftX: number;
		shiftY: number;
		colorScheme: string;
	}
	onClick?: (x: number | string, y?: number) => void;
	onSelect?(from: { x: number, y: number }, to: { x: number, y: number }): void;
	onInit?(value: any): void;
	onScale?([scale, setScale]: [number, Function]): null;
}

const defautSelected = {
	from: { x: 0, y: 0 },
	to: { x: 0, y: 0 },
};

const defaultPixelData = {
	time: 0,
	name: '',
	x: -1,
	y: -1,
};

export const Canvas: FC<PropsWithChildren<Props>> = ({
	color,
	mode = EMode.CLICK,
	className,
	expiration = 0,
	isAuthorized = false,
	isFinished,
	isOnline,
	children,
	src,
	viewOnly,
	expand,
	onClick = () => null,
	onSelect,
	onInit,
}) => {
	const isMobile = 'ontouchstart' in window;
	const firstRender = useRef('');
	const rootRef = useRef<null | HTMLDivElement>(null);
	const canvasRef = useRef<null | HTMLCanvasElement>(null);
	const cur = useRef<[number, number, boolean]>([-1, -1, false]);
	const [coord, setCoord] = useState<[number, number]>([Infinity, Infinity]);
	const [scale, setScale] = useState(2);
	const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [error, setError] = useState('');
	const initialDistance = useRef<number | null>(null);
	const [countdown, setCoundown] = useState(0);
	const [animatedPixel, setAnimatedPixel] = useState(false);
	const selected = useRef(defautSelected);
	const timer = useRef(0);
	const [pixelData, setPixelData] = useState(defaultPixelData);
	const touchMode = useRef<ETouchMode | null>(null);
	const [isProgressInited, setIsProgressInited] = useState(false);
	const showCoordinates = isOnline && !viewOnly;
	const shiftRef = useRef([Infinity, Infinity]);
	const expandPrev = useRef<any>();
	const [prevScale, setPrevScale] = useState(-1);
	const [debugLog, setDebug] = useState({});
	const scaleRef = useRef<number>(2);

	const Log = (key: string, value: string) => {
		if (!DEBUG) {
			return;
		}

		setDebug(v => ({ ...v, [key]: value }));
	};

	const pixelTitle = useMemo(() => {
		const [x, y] = coord;

		if (pixelData.x === x && pixelData.y === y) {
			const time = isFinished
				? formatDate(Number(pixelData.time))
				: `${formatTime(pixelData.time)} назад`;

			if (pixelData.time >= 0) {
				return {
					name: nickSanitize(pixelData.name),
					icon: icons[pixelData.area] && icons[pixelData.area](),
					color: pixelData.color,
					time,
				};
			}

			return {
				label: isFinished
					? 'Про этот пиксель все забыли'
					: 'Пустой пиксель, закрась его'
			};
		}

		return null;
	}, [coord, pixelData, isFinished]);

	const resetImage = (image: any) => {
		const ctx = canvasRef.current && canvasRef.current.getContext('2d');

		if (!ctx || !image) {
			return;
		}

		ctx.drawImage(image, 0, 0);
	};

	const imageLoadHandler = useCallback((image: HTMLImageElement) => {
		if (canvasRef.current) {
			canvasRef.current.width = image.width;
			canvasRef.current.height = image.height;

			if (rootRef.current) {
				const { width, height } = rootRef.current.getBoundingClientRect();

				setPos({
					x: width / 2 - image.width / 2,
					y: height / 2 - image.height / 2,
				});
			}
		}

		const ctx = canvasRef.current && canvasRef.current.getContext('2d');

		if (!ctx) {
			return;
		}

		ee.on('ws:drawPix', ({ x, y, color }: any) => {
			if (ctx) {
				ctx.fillStyle = color;
				ctx.fillRect(x + shiftRef.current[0], y + shiftRef.current[1], 1, 1);
			}
		});
	}, [canvasRef.current]);

	const centering = () => {
		if (rootRef.current && canvasRef.current) {
			const { width, height } = rootRef.current.getBoundingClientRect();
			const canvas = canvasRef.current.getBoundingClientRect();

			setPos({
				x: width / 2 - canvas.width / scaleRef.current / 2,
				y: height / 2 - canvas.height / scaleRef.current / 2,
			});
		}
	};

	const mouseDownCallback = ({ clientX, clientY, target, touches }: any) => {
		cur.current = [-1, -1, false];

		if (touches && touches.length) {
			clientX = touches[0].clientX;
			clientY = touches[0].clientY;

			touchMode.current = touches.length === 1
				? ETouchMode.MOVE
				: ETouchMode.SCALE;
		}

		if (touches && touches.length >= 2) {
			return;
		}

		if (
			rootRef.current &&
			rootRef.current.contains(target as Node) &&
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current)
		) {
			cur.current = [clientX, clientY, false];

			if (mode === EMode.SELECT) {
				const { top, left } = canvasRef.current.getBoundingClientRect();
				const x = Math.floor((clientX - left) / scale);
				const y = Math.floor((clientY - top) / scale);

				selected.current = {
					from: { x, y },
					to: { x, y },
				};
			}
		}
	};

	const mouseMoveCallback = ({ clientX, clientY, touches }: any) => {
		if (touches) {
			clientX = touches[0].clientX;
			clientY = touches[0].clientY;
		}

		// touch resize
		if (touches && touches.length === 2) {
			const touch1 = touches[0];
			const touch2 = touches[1];
			const dx = touch1.clientX - touch2.clientX;
			const dy = touch1.clientY - touch2.clientY;
			const currentDistance = Math.sqrt(dx * dx + dy * dy);

			if (!initialDistance.current) {
				initialDistance.current = currentDistance;
			} else {
				const scaleFactor = currentDistance / initialDistance.current;
				setScale((scale) => getInRange(scale * scaleFactor, [minScale, maxScale]));
				initialDistance.current = currentDistance;
			}

			Log('move-type', 'resize');

			return;
		}

		const efp = document.elementFromPoint(clientX, clientY);
		const isOverChild = rootRef.current && rootRef.current.contains(efp);

		// move
		if (
			!cur.current.some((e) => e === -1) &&
			(mode === EMode.CLICK || mode === EMode.PICK) &&
			isOverChild
		) {
			const moveX = (clientX - cur.current[0]) / scale;
			const moveY = (clientY - cur.current[1]) / scale;

			const [, , moved] = cur.current;

			const { width = 0, height = 0 } = rootRef.current && rootRef.current.getBoundingClientRect() || {};
			const { width: canvasW = 0, height: canvasH = 0 } = canvasRef.current && canvasRef.current.getBoundingClientRect() || {};
			const center = [
				width / 2,
				height / 2,
			];

			const leftFrontier = center[0] - canvasW / scale + 1;
			const rightFrontier = center[0];
			const topFrontier = center[1] - canvasH / scale + 1;
			const bottomFrontier = center[1];

			setPos((pos) => {
				return {
					x: getInRange(pos.x + moveX, [leftFrontier, rightFrontier]),
					y: getInRange(pos.y + moveY, [topFrontier, bottomFrontier]),
				};
			});
			cur.current = [clientX, clientY, moved || Boolean(Math.abs(moveX) + Math.abs(moveY))];
		}

		Log('clientXY', [clientX, clientY].join(', '));
		Log('posIsAbove', String(canvasRef.current && posIsAbove([clientX, clientY], canvasRef.current)));
		Log('canvasRef', String(Boolean(canvasRef.current)) + ' - ' + Date.now());

		// drag
		if (
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current)
		) {
			if (!isOverChild) {
				if (mode === EMode.CLICK) {
					Log('setCoord', '#1');
					// setCoord([Infinity, Infinity]);
				}

				Log('move-type', 'drag outside');

				return;
			}

			const { top, left } = canvasRef.current.getBoundingClientRect();
			const x = Math.floor((clientX - left) / scale);
			const y = Math.floor((clientY - top) / scale);

			if (mode === EMode.SELECT && !cur.current.some((e) => e === -1)) {
				selected.current = {
					from: selected.current.from,
					to: {
						x: x + (x > selected.current.from.x ? 1 : 0),
						y: y + (y > selected.current.from.y ? 1 : 0),
					},
				};
			}

			if (isMobile) {
				const { width, height } = (canvasRef.current as any).parentNode.parentNode.getBoundingClientRect();
				const center = [width / scale / 2, height / scale / 2];

				Log('setCoord', '#2');
				setCoord([
					getInRange(Math.abs(Math.round(center[0] - pos.x)), [0, canvasRef.current.width - 1]) - shiftRef.current[0],
					getInRange(Math.abs(Math.round(center[1] - pos.y)), [0, canvasRef.current.height - 1]) - shiftRef.current[1],
				]);

				return;
			}

			Log('setCoord', '#3');
			Log('- x', String(x));
			Log('- y', String(y));
			Log('- shiftX', String(shiftRef.current[0]));
			Log('- shiftY', String(shiftRef.current[1]));
			setCoord([x - shiftRef.current[0], y - shiftRef.current[1]]);

			Log('move-type', 'drag');
		} else {
			Log('setCoord', '#4');
			setCoord([Infinity, Infinity]);
			Log('move-type', 'no drag');
		}
	};

	const mouseUpCallback = ({ clientX, clientY, touches }: any) => {
		if (touches && touches.length) {
			clientX = cur.current[0] || clientX;
			clientY = cur.current[1] || clientY;

			initialDistance.current = null;
		}

		const [, , moved] = cur.current;

		// touch
		if (typeof clientX === 'undefined' || typeof clientY === 'undefined') {
			if (
				isMobile &&
				touchMode.current === ETouchMode.MOVE &&
				canvasRef.current &&
				!moved
			) {
				const { width, height } = (canvasRef.current as any).parentNode.parentNode.getBoundingClientRect();
				const center = [width / scale / 2, height / scale / 2];
				const x = Math.abs(Math.round(center[0] - pos.x));
				const y = Math.abs(Math.round(center[1] - pos.y));

				if (scale < showPixelScale) {
					Log('setCoord', '#5');
					setCoord([x - shiftRef.current[0], y - shiftRef.current[1]]);
					setScale(showPixelScaleMobile);
				} else {
					const [_x, _y] = cur.current;
					const efp = document.elementFromPoint(_x, _y);
					const isOverChild = rootRef.current && rootRef.current.contains(efp);

					if (mode === EMode.PICK) {
						const ctx = canvasRef.current && canvasRef.current.getContext('2d');
						const imageData = (ctx as any).getImageData(x, y, 1, 1);
						const color = ctx && imageData && imageData.data && rgbToHex(imageData.data);

						if (color && isOverChild) {
							onClick(color as string);
						}

						return;
					}

					if (isOverChild) {
						onClick(coord[0], coord[1]);
					}
				}
			}

			return;
		}

		const efp = document.elementFromPoint(clientX, clientY);
		const isOverChild = rootRef.current && rootRef.current.contains(efp);

		if (
			!moved &&
			!cur.current.some((e) => e === -1) &&
			(scale >= showPixelScale || mode === EMode.SELECT) &&
			canvasRef.current &&
			document.elementsFromPoint(clientX, clientY).includes(canvasRef.current as HTMLCanvasElement) &&
			posIsAbove([clientX, clientY], canvasRef.current) &&
			isOverChild &&
			(!isMobile || touchMode.current === ETouchMode.MOVE)
		) {
			const { top, left } = canvasRef.current.getBoundingClientRect();
			const x = Math.floor((clientX - left) / scale) - shiftRef.current[0];
			const y = Math.floor((clientY - top) / scale) - shiftRef.current[1];

			if (mode === EMode.SELECT) {
				if (onSelect) {
					onSelect(selected.current.from, {
						x: x + shiftRef.current[0] + (x > selected.current.from.x ? 1 : 0),
						y: y + shiftRef.current[1] + (y > selected.current.from.y ? 1 : 0),
					});
				}
				selected.current = defautSelected;
			} else {
				onClick(x, y);
				setPixelData(defaultPixelData);
			}
		}

		if (
			!moved &&
			scale < showPixelScale &&
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current) &&
			mode === EMode.CLICK &&
			!viewOnly &&
			isOverChild &&
			(!isMobile || touchMode.current === ETouchMode.MOVE)
		) {
			setScale(showPixelScale);
		}

		if (
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current) &&
			mode === EMode.PICK &&
			isOverChild
		) {
			const { top, left } = canvasRef.current.getBoundingClientRect();
			const x = Math.floor((clientX - left) / scale);
			const y = Math.floor((clientY - top) / scale);
			const ctx = canvasRef.current && canvasRef.current.getContext('2d');
			const color = ctx && rgbToHex((ctx as any).getImageData(x, y, 1, 1).data);

			if (color) {
				onClick(color);
			}
		}

		cur.current = [-1, -1, false];
	};

	const dragCallback = (event: DragEvent) => {
		event.preventDefault();
	};

	const handleRootWheel = ({ deltaY, clientX, clientY }: any) => {
		if (error) {
			return;
		}

		if (posIsAbove([clientX, clientY], canvasRef.current as HTMLCanvasElement)) {
			const { left, top, width: canvasW = 0, height: canvasH = 0 } = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect();
			const { offsetWidth, offsetHeight } = document.body;
			const { width = 0, height = 0 } = rootRef.current && rootRef.current.getBoundingClientRect() || {};

			const x = (clientX - left) / scale;
			const y = (clientY - top) / scale;

			const relativeCenterX = (offsetWidth / 2 - left) / scale;
			const relativeCenterY = (offsetHeight / 2 - top) / scale;

			const cursorShiftX = x - relativeCenterX;
			const cursorShiftY = y - relativeCenterY;

			const shiftX = relativeCenterX - x + cursorShiftX / scaleDegree;
			const shiftY = relativeCenterY - y + cursorShiftY / scaleDegree;

			const center = [
				width / 2,
				height / 2,
			];

			const leftFrontier = center[0] - canvasW / scale;
			const rightFrontier = center[0];
			const topFrontier = center[1] - canvasH / scale;
			const bottomFrontier = center[1];

			if (
				(deltaY > 0 && scale <= minScale) ||
				(deltaY < 0 && scale >= maxScale)
			) {
				return;
			}

			setScale((scale) => getInRange(deltaY < 0 ? scale * scaleDegree : scale / scaleDegree, [minScale, maxScale]));
			setPos((pos) => (
				deltaY < 0 ? {
					x: getInRange(pos.x + shiftX, [leftFrontier, rightFrontier]),
					y: getInRange(pos.y + shiftY, [topFrontier, bottomFrontier]),
				} : {
					x: getInRange(pos.x - shiftX, [leftFrontier, rightFrontier]),
					y: getInRange(pos.y - shiftY, [topFrontier, bottomFrontier]),
				}
			));
		} else {
			setScale((scale) => getInRange(deltaY < 0 ? scale * scaleDegree : scale / scaleDegree, [minScale, maxScale]));
		}
	};

	const getPixelStyle = () => {
		if (prevScale !== scale) {
			setTimeout(() => {
				setPrevScale(scale);
			}, 0);

			return null;
		}

		const { left = 0, top = 0 } = canvasRef.current && canvasRef.current.getBoundingClientRect() || {};
		const { width = 0, height = 0 } = canvasRef.current || {};
		const [x, y] = coord;

		const _color = (isFinished || mode === EMode.PICK)
			? getPixelColor(canvasRef.current, x + shiftRef.current[0], y + shiftRef.current[1])
			: color;

		const style: any = {
			display: scale < showPixelScale || coord.some((e) => e === Infinity) || coord[0] >= width || coord[1] >= height ? 'none' : 'block',
			left: `${left + (x + shiftRef.current[0]) * scale}px`,
			top: `${top + (y + shiftRef.current[1]) * scale}px`,
			width: `${scale}px`,
			height: `${scale}px`,
			'--bg-color': _color,
			'--border-color': _color && rgbToHex(invertRgb(hexToRgb(_color))),
		};

		if (isMobile) {
			style.transform = `translate(${Math.floor(window.innerWidth / 2 - scale / 2)}, ${Math.floor(window.innerHeight / 2 - scale / 2)})`;
		}

		return style;
	};

	const getSelectedStyle = () => {
		const { from, to } = selected.current;
		const x = Math.min(from.x, to.x);
		const y = Math.min(from.y, to.y);
		const width = Math.max(from.x, to.x) - x;
		const height = Math.max(from.y, to.y) - y;

		if (!width && !height) {
			return {
				display: 'none',
			};
		}

		return {
			top: `${y}px`,
			left: `${x}px`,
			width: `${width}px`,
			height: `${height}px`,
		};
	};

	const renderCountdown = () => {
		const sec = Math.ceil(countdown / 1000);
		const min = Math.floor(sec / 60);
		const text = `${String(min).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

		return (
			<span className={s.countdown}>
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				<div className={s.countdownProgress} style={{
					transition: `all ${expiration - Date.now()}ms linear`,
					width: isProgressInited ? '100%' : '0%',
				}}></div>
				<div className={s.countdownLabel}>{text}</div>
			</span>
		);
	};

	const onPix = (payload: string) => {
		if (isMobile && payload === 'ok') {
			setAnimatedPixel(true);
			setTimeout(() => {
				setAnimatedPixel(false);
			}, 500);
		}
	};

	const onExpand = (payload: any) => {
		if (!payload || !canvasRef.current) {
			return;
		}

		const isInit = shiftRef.current[0] === Infinity || shiftRef.current[1] === Infinity;

		const tempCanvas = document.createElement('canvas');
		const tempContext = tempCanvas.getContext('2d') as CanvasRenderingContext2D;

		tempCanvas.width = canvasRef.current.width;
		tempCanvas.height = canvasRef.current.height;
		tempContext.drawImage(canvasRef.current, 0, 0);

		const ctx = (canvasRef.current as any).getContext('2d');

		canvasRef.current.width = Number(payload.width);
		canvasRef.current.height = Number(payload.height);

		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, Number(payload.width), Number(payload.height));
		if (isInit) {
			ctx.drawImage(tempCanvas, 0, 0);
		} else {
			ctx.drawImage(tempCanvas, Number(payload.shiftX) - shiftRef.current[0], Number(payload.shiftY) - shiftRef.current[1]);
		}
		shiftRef.current = [
			Number(payload.shiftX),
			Number(payload.shiftY),
		];
	};

	useEffect(() => {
		if (rootRef.current && canvasRef.current && src && firstRender.current !== src) {
			firstRender.current = src as string;

			const image = new Image();
			const { protocol, hash } = document.location;

			const sourceProtocol = hash === '#secured' ? 'https:' : protocol;

			image.src = src || `${sourceProtocol}//${WSHost}/canvas.png`;
			image.setAttribute('crossOrigin', '');
			image.onload = () => {
				imageLoadHandler(image);
				resetImage(image);
				if (onInit) {
					onInit({
						image: canvasRef.current,
						setScale,
						centering,
						resetImage: () => resetImage(image),
					});
				}
			};
			image.onerror = (err) => {
				setError(err.toString());
				setScale(1);
				if (onInit) {
					onInit({
						image: canvasRef.current,
						setScale,
						centering,
						resetImage: () => resetImage(image),
					});
				}
			};
		}

		document.addEventListener(isMobile ? 'touchstart' : 'mousedown', mouseDownCallback);
		document.addEventListener(isMobile ? 'touchmove' : 'mousemove', mouseMoveCallback);
		document.addEventListener(isMobile ? 'touchend' : 'mouseup', mouseUpCallback);
		document.addEventListener('drag', dragCallback);

		return () => {
			document.removeEventListener(isMobile ? 'touchstart' : 'mousedown', mouseDownCallback);
			document.removeEventListener(isMobile ? 'touchmove' : 'mousemove', mouseMoveCallback);
			document.removeEventListener(isMobile ? 'touchend' : 'mouseup', mouseUpCallback);
			document.removeEventListener('drag', dragCallback);
		};
	}, [
		scale,
		coord,
		pos,
		color,
		mode,
		src,
		viewOnly,
	]);

	useEffect(() => {
		const timer = setInterval(() => {
			if (expiration && Date.now() < expiration) {
				setCoundown(expiration - Date.now());
			} else {
				setCoundown(0);
				clearInterval(timer);
			}
		}, 300);

		return () => {
			clearInterval(timer);
		};
	}, [expiration]);

	useEffect(() => {
		setIsProgressInited(countdown > 0);
	}, [countdown]);

	useEffect(() => {
		Log('isAuthorized', String(isAuthorized));

		ee.on('pix', onPix);

		return () => {
			ee.off('pix', onPix);
		};
	}, [isAuthorized]);

	useEffect(() => {
		if (viewOnly) {
			return;
		}

		clearTimeout(timer.current);

		if (scale >= showPixelScale && !coord.some((e) => e === Infinity)) {
			timer.current = Number(setTimeout(() => {
				getPixel(...coord)
					.then(setPixelData)
					.catch(() => {/* */ });
			}, 1000));
		}
	}, [coord, scale, viewOnly]);

	useEffect(() => {
		if (!expand) {
			return;
		}

		if (eq(expandPrev.current, expand)) {
			return;
		}

		expandPrev.current = expand;

		onExpand(expand);
	}, [expand]);

	useEffect(() => {
		scaleRef.current = scale;
	}, [scale]);

	useEffect(() => {
		Log('set-color', color);
	}, [color]);

	useEffect(() => {
		Log('mode', mode);
	}, [mode]);

	return (
		<>
			<div
				ref={rootRef}
				className={cn(s.root, className)}
				onWheel={handleRootWheel}
			>
				<div
					className={s.workbench}
					style={{
						transform: `scale(${scale})`,
					}}
				>
					<div
						className={s.draggable}
						style={{
							transform: `translate(${Math.floor(pos.x)}px, ${Math.floor(pos.y)}px)`,
						}}
					>
						<canvas
							ref={canvasRef}
							className={cn(
								s.canvas,
								{
									[s.inactive]: scale < showPixelScale && !viewOnly,
									[s.pickable]: mode === EMode.PICK,
								},
							)}
						/>
						{children}
						{mode === EMode.SELECT && (
							<div
								className={s.select}
								style={getSelectedStyle()}
							/>
						)}
					</div>
					{error && <img className={s.image404} src={image404} alt="Полотно пиксель батла" />}
				</div>
				{showCoordinates && (
					<>
						<div className={s.coordinates}>
							{countdown > 0 && (
								<>{renderCountdown()}&nbsp;</>
							)}
							{coord[0] !== Infinity && `[${coord.join(', ')}]`} X{Number(scale.toFixed(1))}
						</div>
						{scale >= showPixelScale && (
							<div
								className={cn(s.pixel, { [s.animated]: animatedPixel })}
								style={(scale && prevScale && mode) ? getPixelStyle() : {}}
							>
								{pixelTitle && (
									<div className={s.tooltip}>
										<div className={s.tooltipName}>
											{pixelTitle.icon || ''}
											{pixelTitle.label || pixelTitle.name}
										</div>
										{pixelTitle.time && (
											<div>{pixelTitle.time}</div>
										)}
										{pixelTitle.color && (
											<div>
												<span style={{ backgroundColor: pixelTitle.color }}>&nbsp;&nbsp;</span>
												&nbsp;
												{pixelTitle.color}
											</div>
										)}
									</div>
								)}
								<div className={s.pixelInside}></div>

							</div>
						)}
					</>
				)}
			</div>

			{DEBUG && (
				<div className={s.debug} id="debug-log">
					{Object.entries(debugLog).map(([key, value]) => (
						<div key={key}>{key}: {String(value)}</div>
					))}
				</div>
			)}
		</>
	);
};
