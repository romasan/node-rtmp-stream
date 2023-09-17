import React, { FC } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import * as s from './Chat.module.scss';

interface Props {
	
}

export const Chat: FC<Props> = ({}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 380, y: 10});

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			<div className={s.content}>
				<div>FOO</div>
				<div>BAR</div>
				<div>BUZ</div>
				<div>akdjfhl ajhdf lkajsdhf lkjasdhf lkajsdhf lkajsdhf lkajdshf lkajsdhf lakjsdhf laksjdhf lkasjdhf lkasjhdf lkajsf </div>
			</div>
			<div>
				<input type="text" />
			</div>
		</div>
	);
}
