import React, { FC, useRef, useEffect, MouseEvent } from 'react';

import ee from '../../ee';

import s from './Canvas.module.scss';

interface Props {
	onClick(x: number, y: number): void;
}
export const Canvas: FC<Props> = ({ onClick }) => {
	const canvasRef = useRef<null | HTMLCanvasElement>(null);

	const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
		const { clientX, clientY, currentTarget } = event;
		const { top, left } = currentTarget.getBoundingClientRect();
		const x = clientX - left;
		const y = clientY - top;
		onClick(x, y);
	}

	useEffect(() => {
		if (canvasRef.current) {
			const image = new Image();
			image.src = document.location.protocol + '//' + document.location.hostname + ':8080/canvas.png';
			image.onload = () => {
				if (canvasRef.current) {
					canvasRef.current.width = image.width;
					canvasRef.current.height = image.height;
				}
				const ctx = canvasRef.current?.getContext('2d');
				ctx?.drawImage(image, 0, 0);
				ee.on('drawPix', ({ x, y, color }) => {
					if (ctx) {
						ctx.fillStyle = color;
						ctx.fillRect(x, y, 1, 1);
					}
				});
			}
		}
	}, [canvasRef.current]);

	return (
		<div>
			<canvas ref={canvasRef} className={s.canvas} onClick={handleCanvasClick}></canvas>
		</div>
	);
}
