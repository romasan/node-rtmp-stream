import React, { FC } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import pen from 'url:../../../assets/pen.svg';
import plus from 'url:../../../assets/plus.svg';
import minus from 'url:../../../assets/minus.svg';
import expand from 'url:../../../assets/expand.svg';
// import clock from 'url:../../../assets/clock.svg';

import * as s from './Bar.module.scss';

interface Props {
	onDraw?(): void;
	onPlus?(): void;
	onMinus?(): void;
	onPlace?(): void;
}

export const Bar: FC<Props> = ({
	onDraw,
	onPlus,
	onMinus,
	onPlace,
}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: 10, y: 60});

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			{onDraw && (
				<button className={s.button} onClick={onDraw}>
					<img src={pen} alt="Рисовать" />
				</button>
			)}
			{onPlus && (
					<button className={s.button} onClick={onPlus}>
					<img src={plus} alt="Увеличить масштаб" />
				</button>
			)}
			{onMinus && (
				<button className={s.button} onClick={onMinus}>
					<img src={minus} alt="Уменьшить масштаб" />
				</button>
			)}
			{onPlace && (
				<button className={s.button} onClick={onPlace}>
					<img src={expand} alt="Показать всё полотно" />
				</button>
			)}
			{/* TODO */}
			{/* <button className={s.button}>
				<img src={clock} alt="Таймлапс" />
			</button> */}
		</div>
	);
};
