import React, { FC, useState, useMemo, useEffect } from 'react';

import cn from 'classnames';

import { Block } from '../Block';

import {
	get,
	put,
	patch,
} from '../../helpers';

import { EMode } from '../../../Canvas';

// import * as s from './FillSquare.module.scss';

interface Props {
	canvas: any;
	range: any;
	color: string;
	setCanvasMode: (value: EMode) => void;
}

export const FillSquare: FC<Props> = ({
	canvas,
	range,
	color,
	setCanvasMode,
}) => {
	const [opened, setOpened] = useState(false);

	const onOpen = () => {
		if (canvas) {
			canvas.width = canvas.width;
		}
		setCanvasMode(EMode.SELECT);
	};

	const onClose = () => {
		if (canvas) {
			canvas.width = canvas.width;
		}
		setCanvasMode(EMode.CLICK);
	};

	const fillSquare = () => {
		put('fillSquare', JSON.stringify({
			...range,
			color,
		}), 'TEXT');
	};

	useEffect(() => {
		if (opened) {
			canvas.width = canvas.width;

			const ctx = canvas.getContext('2d');

			ctx.fillStyle = color;
			ctx.fillRect(
				range?.from?.x,
				range?.from?.y,
				range?.to?.x - range?.from?.x,
				range?.to?.y - range?.from?.y,
			);
		}
	}, [canvas, range, color, opened]);

	return (
		<Block title="Заполнение области цветом"
			onOpen={onOpen}
			onClose={onClose}
			onToggle={setOpened}
		>
			<div>[{range?.from?.x || -1}:{range?.from?.y || -1} - {range?.to?.x || -1}:{range?.to?.y || -1}] {color}</div>
			<div>{Math.abs(range?.from?.x - range?.to?.x) * Math.abs(range?.from?.y - range?.to?.y)} pixels</div>
			<div>
				<button onClick={fillSquare}>готово</button>
			</div>
		</Block>
	);
}