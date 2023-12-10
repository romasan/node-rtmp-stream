import React, { FC } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import { getInRange } from '../../helpers';

import { showPixelScale, minScale, maxScale } from '../../const';

import PenIcon from '../../../assets/pen.svg';
import PlusIcon from '../../../assets/plus.svg';
import MinusIcon from '../../../assets/minus.svg';
import ExpandIcon from '../../../assets/expand.svg';
// import clock from '../../../assets/clock.svg';

import * as s from './Bar.module.scss';

interface Props {
	setScale: any;
	centering: () => void;
	isFinished: boolean;
}

export const Bar: FC<Props> = ({
	setScale,
	centering,
	isFinished,
}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: 10, y: 80 });

	const handleClickDraw = () => {
		if (isFinished) {
			return;
		}
		setScale((scale: number) => Math.max(scale, showPixelScale));
	};

	const handleClickPlus = () => {
		setScale((scale: number) => getInRange(scale * 2, [minScale, maxScale]));
	};

	const handleClickMinus = () => {
		setScale((scale: number) => getInRange(scale / 2, [minScale, maxScale]));
	};

	const handleClickPlace = () => {
		setScale(2);
		setTimeout(centering);
	};

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			<button className={s.button} onClick={handleClickDraw} aria-label="Рисовать">
				<PenIcon />
			</button>
			<button className={s.button} onClick={handleClickPlus} aria-label="Увеличить масштаб">
				<PlusIcon />
			</button>
			<button className={s.button} onClick={handleClickMinus} aria-label="Уменьшить масштаб">
				<MinusIcon />
			</button>
			<button className={s.button} onClick={handleClickPlace} aria-label="Показать всё полотно">
				<ExpandIcon />
			</button>
			{/* TODO */}
			{/* <button className={s.button}>
				<img src={'data:image/svg+xml;utf8,' + clock} alt="Таймлапс" />
			</button> */}
		</div>
	);
};
