import React, { FC } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import pen from '../../../assets/pen.svg';
import plus from '../../../assets/plus.svg';
import minus from '../../../assets/minus.svg';
import expand from '../../../assets/expand.svg';
// import clock from '../../../assets/clock.svg';

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
					<img src={'data:image/svg+xml;utf8,' + pen} alt="Рисовать" />
				</button>
			)}
			{onPlus && (
					<button className={s.button} onClick={onPlus}>
					<img src={'data:image/svg+xml;utf8,' + plus} alt="Увеличить масштаб" />
				</button>
			)}
			{onMinus && (
				<button className={s.button} onClick={onMinus}>
					<img src={'data:image/svg+xml;utf8,' + minus} alt="Уменьшить масштаб" />
				</button>
			)}
			{onPlace && (
				<button className={s.button} onClick={onPlace}>
					<img src={'data:image/svg+xml;utf8,' + expand} alt="Показать всё полотно" />
				</button>
			)}
			{/* TODO */}
			{/* <button className={s.button}>
				<img src={'data:image/svg+xml;utf8,' + clock} alt="Таймлапс" />
			</button> */}
		</div>
	);
};
