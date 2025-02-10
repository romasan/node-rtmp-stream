import React, { FC, useState, useMemo, useEffect } from 'react';

import { Block } from '../Block';

import { put } from '../../helpers';

import { EMode } from '../../../Canvas';

import { colorSchemes } from '../../../../../server/constants/colorSchemes';

interface Props {
	canvas: any;
	range: any;
	color: string;
	expand?: {
		width: number;
		height: number;
		shiftX: number;
		shiftY: number;
		colorScheme: string;
	}
	setCanvasMode: (value: EMode) => void;
}

export const FillSquare: FC<Props> = ({
	canvas,
	range,
	color,
	expand,
	setCanvasMode,
}) => {
	const [opened, setOpened] = useState(false);

	const band = useMemo(
		() => ({
			from: {
				x: (range.from && range.from.x) - (expand ? expand.shiftX : 0),
				y: (range.from && range.from.y) - (expand ? expand.shiftY : 0),
			},
			to: {
				x: (range.to && range.to.x) - (expand ? expand.shiftX : 0),
				y: (range.to && range.to.y) - (expand ? expand.shiftY : 0),
			},
		}),
		[range, expand],
	);

	const _color = useMemo(() => {
		const key = expand && expand.colorScheme;
		const colorScheme = (colorSchemes as any)[key] || {};

		return colorScheme[color];
	}, [color, colorSchemes, expand]);

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
			...band,
			color,
		}), 'TEXT');
	};

	useEffect(() => {
		if (opened && range.from && range.to) {
			canvas.width = canvas.width;

			const ctx = canvas.getContext('2d');

			ctx.fillStyle = _color;
			ctx.fillRect(
				range.from.x,
				range.from.y,
				range.to.x - range.from.x,
				range.to.y - range.from.y,
			);
		}
	}, [canvas, range, _color, opened]);

	return (
		<Block title="🖌️ Заполнение области цветом"
			onOpen={onOpen}
			onClose={onClose}
			onToggle={setOpened}
		>
			{(range.from && range.to) ? (
				<>
					<div>
						[&nbsp;
						{band.from.x || -1}
						:
						{band.from.y || -1}
						&nbsp;-&nbsp;
						{band.to.x || -1}
						:
						{band.to.y || -1}
						&nbsp;]&nbsp;
						{color} ({_color})
					</div>
					<div>{Math.abs(range.from.x - range.to.x) * Math.abs(range.from.y - range.to.y)} pixels</div>
				</>
			) : 'Выбери область для предпросмотра'}
			<div>
				<button onClick={fillSquare}>заливка области</button>
			</div>
		</Block>
	);
};
