import { FC, useState, useEffect } from 'preact/compat';

import { Block } from '../Block';

import { put } from '../../helpers';

import { EMode } from '../../../Canvas';

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
		if (opened && range.from && range.to) {
			canvas.width = canvas.width;

			const ctx = canvas.getContext('2d');

			ctx.fillStyle = color;
			ctx.fillRect(
				range.from.x,
				range.from.y,
				range.to.x - range.from.x,
				range.to.y - range.from.y,
			);
		}
	}, [canvas, range, color, opened]);

	return (
		<Block title="Заполнение области цветом"
			onOpen={onOpen}
			onClose={onClose}
			onToggle={setOpened}
		>
			{(range.from && range.to) ? (
				<>
					<div>[{range.from.x || -1}:{range.from.y || -1} - {range.to.x || -1}:{range.to.y || -1}] {color}</div>
					<div>{Math.abs(range.from.x - range.to.x) * Math.abs(range.from.y - range.to.y)} pixels</div>
				</>
			) : 'Выбери область для предпросмотра'}
			<div>
				<button onClick={fillSquare}>заливка области</button>
			</div>
		</Block>
	);
};
