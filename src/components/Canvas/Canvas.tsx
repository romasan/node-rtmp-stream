import React, { FC, useRef, useState, useMemo, useCallback, useEffect, MouseEvent, WheelEventHandler } from 'react';

import ee from '../../ee';
import { WSHost } from '../../ws';

import s from './Canvas.module.scss';

interface Props {
	onClick(x: number, y: number): void;
}
export const Canvas: FC<Props> = ({ onClick }) => {
	const firstRender = useRef(true);
	const rootRef = useRef<null | HTMLDivElement>(null);
	const canvasRef = useRef<null | HTMLCanvasElement>(null);
	const cur = useRef<[number, number, boolean]>([-1, -1, false]);
	const [coord, setCoord] = useState<[number, number]>([-1, -1]);
	const [scale, setScale] = useState(2);
	const [pos, setPos] = useState<{ x: number; y: number}>({ x: 0, y: 0 });

	// const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
	// 	const { clientX, clientY, currentTarget } = event;
	// 	const { top, left } = currentTarget.getBoundingClientRect();
	// 	const x = clientX - left;
	// 	const y = clientY - top;
	// 	onClick(x, y);
	// }

	const mouseDownCallback = ({ clientX, clientY, target }: any) => {
		if (canvasRef.current?.contains(target as Node)) {
			cur.current = [clientX, clientY, false];
		}
	};

	const mouseMoveCallback = ({ clientX, clientY, target }: any) => {
		if (!cur.current.some((e) => e === -1)) {
			const moveX = clientX - cur.current[0];
			const moveY = clientY - cur.current[1];

			const [,, moved] = cur.current;

			setPos((pos) => ({ x: pos.x + moveX, y: pos.y + moveY }));
			cur.current = [clientX, clientY, moved || Boolean(Math.abs(moveX) + Math.abs(moveX))];
		}

		if (canvasRef.current?.contains(target as Node)) {
			const { top, left } = canvasRef.current.getBoundingClientRect();
			const x = Math.floor((clientX - left) / scale);
			const y = Math.floor((clientY - top) / scale);

			setCoord([x, y]);
		} else {
			setCoord([-1, -1]);
		}
	};

	const mouseUpCallback = ({ clientX, clientY, target }: any) => {
		const [,, moved] = cur.current;

		if (!moved && canvasRef.current?.contains(target as Node)) {
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
		console.log('==== handleRootWheel', scale, pos.x, pos.y);
		// change scale at center of screen
		setScale((scale) => Math.min(Math.max(scale + (event.deltaY < 0 ? .2 : -.2), .5), 30));
		// setPos()
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
	}, [rootRef.current, canvasRef.current, scale]);

	return (
		<div
			ref={rootRef}
			className={s.root}
			onWheel={handleRootWheel}
		>
			<canvas
				ref={canvasRef}
				className={s.canvas}
				style={{
					transform: `scale(${scale})`,
					left: `${pos.x}px`,
					top: `${pos.y}px`,
				}}
			/>
			<div className={s.coordinates}>[{coord.join(', ')}] x {Number(scale.toFixed(2))}</div>
		</div>
	);
}
