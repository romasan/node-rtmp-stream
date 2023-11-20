import React, { FC } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import PenIcon from '../../../assets/pen.svg';
import PlusIcon from '../../../assets/plus.svg';
import MinusIcon from '../../../assets/minus.svg';
import ExpandIcon from '../../../assets/expand.svg';
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
					<PenIcon />
				</button>
			)}
			{onPlus && (
					<button className={s.button} onClick={onPlus}>
					<PlusIcon />
				</button>
			)}
			{onMinus && (
				<button className={s.button} onClick={onMinus}>
					<MinusIcon />
				</button>
			)}
			{onPlace && (
				<button className={s.button} onClick={onPlace}>
					<ExpandIcon />
				</button>
			)}
			{/* TODO */}
			{/* <button className={s.button}>
				<img src={'data:image/svg+xml;utf8,' + clock} alt="Таймлапс" />
			</button> */}
		</div>
	);
};
