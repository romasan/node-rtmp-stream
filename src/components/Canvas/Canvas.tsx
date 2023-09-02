import React, { FC, useRef, useState, useCallback, useEffect } from 'react';

import mobile from 'is-mobile';

import cn from 'classnames';

import ee from '../../lib/ee';
import { WSHost } from '../../lib/ws';
import {
	posIsAbove,
	getInRange,
	hexToRgb,
	rgbToHex,
	invertRgb,
} from '../../helpers';

import { Bar } from '../Bar';

import image404 from 'url:../../res/404.png';

import * as s from './Canvas.module.scss';

interface Props {
	color: string;
	mode?: 'click' | 'select';
	onClick(x: number, y: number): void;
	onSelect?: (start: { x: number, y: number }, end: { x: number, y: number }) => void;
}

const showPixelScale = 6;
const scaleDegree = 1.1;
const minScale = .5;
const maxScale = 50;

export const Canvas: FC<Props> = ({ color, mode = 'click', onClick }) => {
	const isMobile = mobile();
	const firstRender = useRef(true);
	const rootRef = useRef<null | HTMLDivElement>(null);
	const canvasRef = useRef<null | HTMLCanvasElement>(null);
	const pixelRef = useRef<null | HTMLDivElement>(null);
	const cur = useRef<[number, number, boolean]>([-1, -1, false]);
	const [coord, setCoord] = useState<[number, number]>([-1, -1]);
	const [scale, setScale] = useState(2);
	const [pos, setPos] = useState<{ x: number; y: number}>({ x: 0, y: 0 });
	const [error, setError] = useState('');
	const initialDistance = useRef<number | null>(null);

	const mouseDownCallback = ({ clientX, clientY, target, touches }: any) => {
		if (touches && touches.length === 1) {
			clientX = touches[0].clientX;
			clientY = touches[0].clientY;
		}

		if (touches && touches.length === 2) {
			return;
		}

		if (
			rootRef.current?.contains(target as Node) &&
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current)
		) {
			cur.current = [clientX, clientY, false];
		}
	};

	const mouseMoveCallback = ({ clientX, clientY, touches }: any) => {
		if (touches) {
			clientX = touches[0].clientX;
			clientY = touches[0].clientY;
		}

		if (touches && touches.length === 2) {
			const touch1 = touches[0];
			const touch2 = touches[1];
			const dx = touch1.clientX - touch2.clientX;
			const dy = touch1.clientY - touch2.clientY;
			const currentDistance = Math.sqrt(dx * dx + dy * dy);

			if (!initialDistance.current) {
				initialDistance.current = currentDistance;
			} else {
				const delta = currentDistance - initialDistance.current;
				initialDistance.current = currentDistance;

				setScale((scale) => getInRange(scale + delta, [minScale, maxScale]));
			}
			return;
		}

		if (!cur.current.some((e) => e === -1)) {
			const moveX = (clientX - cur.current[0]) / scale;
			const moveY = (clientY - cur.current[1]) / scale;

			const [,, moved] = cur.current;

			const { width = 0, height = 0 } = rootRef.current?.getBoundingClientRect() || {};
			const { width: canvasW = 0, height: canvasH = 0 } = canvasRef.current?.getBoundingClientRect() || {};
			const center = [
				width / 2,
				height / 2,
			];

			const leftFrontier = center[0] - canvasW / scale;
			const rightFrontier = center[0];
			const topFrontier = center[1] - canvasH / scale;
			const bottomFrontier = center[1];

			setPos((pos) => {
				return {
					x: getInRange(pos.x + moveX, [leftFrontier, rightFrontier]),
					y: getInRange(pos.y + moveY, [topFrontier, bottomFrontier]),
				}
			});
			cur.current = [clientX, clientY, moved || Boolean(Math.abs(moveX) + Math.abs(moveX))];
		}


		if (canvasRef.current && posIsAbove([clientX, clientY], canvasRef.current)) {
			const { top, left } = canvasRef.current.getBoundingClientRect();
			const x = Math.floor((clientX - left) / scale);
			const y = Math.floor((clientY - top) / scale);

			setCoord([x, y]);
		} else {
			setCoord([-1, -1]);
		}
	};

	const mouseUpCallback = ({ clientX, clientY, target, touches }: any) => {
		if (touches) {
			clientX = cur.current[0];
			clientY = cur.current[1];
		}

		if (touches && touches.length === 2) {
			initialDistance.current = null;

			return;
		}

		const [,, moved] = cur.current;

		if (
			!moved &&
			!cur.current.some((e) => e === -1) &&
			document.elementsFromPoint(clientX, clientY).includes(canvasRef.current as HTMLCanvasElement) &&
			scale >= showPixelScale &&
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current)
		) {
				const { top, left } = canvasRef.current.getBoundingClientRect();
				const x = Math.floor((clientX - left) / scale);
				const y = Math.floor((clientY - top) / scale);

				onClick(x, y);
		}

		if (
			!moved &&
			scale < showPixelScale &&
			canvasRef.current &&
			posIsAbove([clientX, clientY], canvasRef.current)
		) {
			setScale(showPixelScale);
		}

		cur.current = [-1, -1, false];
	}

	const dragCallback = (event: DragEvent) => {
		event.preventDefault();
	}

	const handleRootWheel = ({ deltaY, clientX, clientY, target }: any) => {
		if (error) {
			return;
		}

		if (posIsAbove([clientX, clientY], canvasRef.current as HTMLCanvasElement)) {
			const { left, top, width: canvasW = 0, height: canvasH = 0 } = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect();
			const { offsetWidth, offsetHeight } = document.body;
			const { width = 0, height = 0 } = rootRef.current?.getBoundingClientRect() || {};

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

		const ctx = canvasRef.current?.getContext('2d');
		ctx?.drawImage(image, 0, 0);

		ee.on('ws:drawPix', ({ x, y, color }) => {
			if (ctx) {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		});
	}, [canvasRef.current]);

	const getPixelStyle = () => {
		const { left = 0, top = 0 } = canvasRef.current?.getBoundingClientRect() || {};
		const [x, y] = coord;

		return {
			display: coord.some((e) => e < 0) || scale < showPixelScale ? 'none' : 'block',
			left: `${left + x * scale}px`,
			top: `${top + y * scale}px`,
			width: `${scale}px`,
			height: `${scale}px`,
			background: color,
			borderColor: color && rgbToHex(invertRgb(hexToRgb(color))),
		};
	}

	const handleClickDraw = useCallback(() => {
		setScale((scale) => Math.max(scale, showPixelScale));
	}, []);

	const handleClickPlus = useCallback(() => {
		setScale((scale) => getInRange(scale * 2, [minScale, maxScale]));
	}, []);

	const handleClickMinus = useCallback(() => {
		setScale((scale) => getInRange(scale / 2, [minScale, maxScale]));
	}, []);

	const handleClickPlace = useCallback(() => {
		if (rootRef.current && canvasRef.current) {
			const { width, height } = rootRef.current.getBoundingClientRect();
			const canvas = canvasRef.current.getBoundingClientRect();
			setPos({
				x: width / 2 - canvas.width / scale / 2,
				y: height / 2 - canvas.height / scale / 2,
			});
			setScale(2);
		}
	}, [rootRef.current, canvasRef.current, scale]);

	useEffect(() => {
		if (rootRef.current && canvasRef.current && firstRender.current) {
			firstRender.current = false;

			const image = new Image();
			const { protocol, hash } = document.location;

			const sourceProtocol = hash === '#secured' ? 'https:' : protocol;

			image.src = `${sourceProtocol}//${WSHost}/canvas.png`;
			image.onload = () => imageLoadHandler(image);
			image.onerror = (err) => {
				setError(err.toString());
				setScale(1);
			}
		}

		if (isMobile) {
			document.addEventListener('touchstart', mouseDownCallback);
			document.addEventListener('touchmove', mouseMoveCallback);
			document.addEventListener('touchend', mouseUpCallback);
		} else {
			document.addEventListener('mousedown', mouseDownCallback);
			document.addEventListener('mousemove', mouseMoveCallback);
			document.addEventListener('mouseup', mouseUpCallback);
			document.addEventListener('drag', dragCallback);
		}

		return () => {
			if (isMobile) {
				document.removeEventListener('touchstart', mouseDownCallback);
				document.removeEventListener('touchmove', mouseMoveCallback);
				document.removeEventListener('touchend', mouseUpCallback);
			} else {
				document.removeEventListener('mousedown', mouseDownCallback);
				document.removeEventListener('mousemove', mouseMoveCallback);
				document.removeEventListener('mouseup', mouseUpCallback);
				document.removeEventListener('drag', dragCallback);
			}
		}
	}, [rootRef.current, canvasRef.current, pixelRef.current, scale, color]);

	return (
		<>
			<div
				ref={rootRef}
				className={s.root}
				onWheel={handleRootWheel}
			>
				<div
					className={s.workbench}
					style={{ transform: `scale(${scale})` }}
				>
					<div
						className={s.draggable}
						style={{
							left: `${Math.floor(pos.x)}px`,
							top: `${Math.floor(pos.y)}px`,
						}}
					>
							<canvas
								ref={canvasRef}
								className={cn(s.canvas, {
									[s.inactive]: scale < showPixelScale,
								})}
							/>
					</div>
					{error && <img className={s.image404} src={image404} />}
				</div>
				{!isMobile && (
					<>
						<div className={s.coordinates}>
							{coord[0] >= 0 && `[${coord.join(', ')}]`} x {Number(scale.toFixed(2))}
						</div>
						<div
							className={s.pixel}
							style={scale ? getPixelStyle() : {}}
						/>
					</>
				)}
			</div>
			{!isMobile && (
				<Bar
					onDraw={handleClickDraw}
					onPlus={handleClickPlus}
					onMinus={handleClickMinus}
					onPlace={handleClickPlace}
				/>
			)}
		</>
	);
}
