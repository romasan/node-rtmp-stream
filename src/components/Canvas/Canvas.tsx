import React, { FC, useRef, useState, useMemo, useCallback, useEffect, MouseEvent, WheelEventHandler } from 'react';

import ee from '../../ee';
import { WSHost } from '../../ws';
import { posIsAbove } from '../../helpers';

import s from './Canvas.module.scss';

interface Props {
	onClick(x: number, y: number): void;
}

const globalPadding = 10;
const showPixelScale = 8;
const minScale = .5;
const maxScale = 40;

export const Canvas: FC<Props> = ({ onClick }) => {
	const firstRender = useRef(true);
	const rootRef = useRef<null | HTMLDivElement>(null);
	const canvasRef = useRef<null | HTMLCanvasElement>(null);
	const pixelRef = useRef<null | HTMLDivElement>(null);
	const cur = useRef<[number, number, boolean]>([-1, -1, false]);
	const [coord, setCoord] = useState<[number, number]>([-1, -1]);
	const [scale, setScale] = useState(2);
	const [pos, setPos] = useState<{ x: number; y: number}>({ x: 0, y: 0 });

	const mouseDownCallback = ({ clientX, clientY }: any) => {
		if (canvasRef.current && posIsAbove([clientX, clientY], canvasRef.current)) {
			cur.current = [clientX, clientY, false];
		}
	};

	const mouseMoveCallback = ({ clientX, clientY }: any) => {
		if (!cur.current.some((e) => e === -1)) {
			const moveX = (clientX - cur.current[0]) / scale;
			const moveY = (clientY - cur.current[1]) / scale;

			const [,, moved] = cur.current;

			setPos((pos) => ({ x: pos.x + moveX, y: pos.y + moveY }));
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

	const mouseUpCallback = ({ clientX, clientY }: any) => {
		const [,, moved] = cur.current;

		if (!moved && scale >= showPixelScale && canvasRef.current && posIsAbove([clientX, clientY], canvasRef.current)) {
				const { top, left } = canvasRef.current.getBoundingClientRect();
				const x = Math.floor((clientX - left) / scale);
				const y = Math.floor((clientY - top) / scale);

				onClick(x, y);
		}
		cur.current = [-1, -1, false];
	}

	const dragCallback = (event: DragEvent) => {
		event.preventDefault();
	}

	const handleRootWheel = (event: any) => {

		setScale((scale) => Math.min(Math.max(scale + (event.deltaY < 0 ? .2 : -.2), minScale), maxScale));
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

		ee.on('drawPix', ({ x, y, color }) => {
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
			left: `${-globalPadding + left + x * scale}px`,
			top: `${-globalPadding + top + y * scale}px`,
			width: `${scale}px`,
			height: `${scale}px`,
			background: 'red',
		};
	}

	useEffect(() => {
		if (rootRef.current && canvasRef.current && firstRender.current) {
			firstRender.current = false;

			const image = new Image();
			const { protocol } = document.location;

			image.src = `${protocol}//${WSHost}/canvas.png`;
			image.onload = () => imageLoadHandler(image);
		}

		document.addEventListener('mousedown', mouseDownCallback);
		document.addEventListener('mousemove', mouseMoveCallback);
		document.addEventListener('mouseup', mouseUpCallback);
		document.addEventListener('drag', dragCallback);

		return () => {
			document.removeEventListener('mousedown', mouseDownCallback);
			document.removeEventListener('mousemove', mouseMoveCallback);
			document.removeEventListener('mouseup', mouseUpCallback);
			document.removeEventListener('drag', dragCallback);
		}
	}, [rootRef.current, canvasRef.current, pixelRef.current, scale]);

	return (
		<div
			ref={rootRef}
			className={s.root}
			onWheel={handleRootWheel}
		>
			<div
				className={s.workbench}
				style={{ transform: `scale(${scale})` }}
			>
				<canvas
					ref={canvasRef}
					className={s.canvas}
					style={{
						left: `${pos.x}px`,
						top: `${pos.y}px`,
					}}
				/>
			</div>
			<div className={s.coordinates}>
				[{coord.join(', ')}] x {Number(scale.toFixed(2))}
			</div>
			<div
				className={s.pixel}
				style={scale ? getPixelStyle() : {}}
			/>
		</div>
	);
}
