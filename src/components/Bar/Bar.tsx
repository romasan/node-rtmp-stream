import React, { FC } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import pen from 'url:../../../res/pen.svg';
import plus from 'url:../../../res/plus.svg';
import minus from 'url:../../../res/minus.svg';
import expand from 'url:../../../res/expand.svg';
// import clock from 'url:../../../res/clock.svg';

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
	const { anchorRef, draggableRef } = useDraggable({ x: 10, y: 10});

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			{onDraw && (
				<button className={s.button} onClick={onDraw}>
					<img src={pen} />
				</button>
			)}
			{onPlus && (
					<button className={s.button} onClick={onPlus}>
					<img src={plus} />
				</button>
			)}
			{onMinus && (
				<button className={s.button} onClick={onMinus}>
					<img src={minus} />
				</button>
			)}
			{onPlace && (
				<button className={s.button} onClick={onPlace}>
					<img src={expand} />
				</button>
			)}
			{/* TODO */}
			{/* <button className={s.button}>
				<img src={clock} />
			</button> */}
		</div>
	);
};
