import React, { FC, useRef, useState, useEffect } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

// import { getChatMessages, sendChatMessage } from '../../lib/api';

import * as s from './Info.module.scss';

interface Props {
	isAuthorized: boolean;
}

interface IMessage {
	id: string;
	time: number;
	text: string;
	name: string;
	avatar: string;
}

export const Info: FC<Props> = ({
	isAuthorized,
	...props,
}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 240, y: 60});

	// useEffect(() => {
	// 	getInfoMessages().then((data) => {
			
	// 	});
	// }, []);

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			<div className={s.content} {...props}>
				<div>Loading...</div>
				{/* <div>Online: 0</div>
				<div>Total pixels: 2 999 999</div>
				<div>
					<div>1. Foo: 1 000 000</div>
					<div>2. Bar: 900 000</div>
					<div>3. Buz: 100 000</div>
					<div>4. Guest: 90 000</div>
					<div>5. Guest: 80 000</div>
					<div>6. Guest: 70 000</div>
					<div>7. Guest: 60 000</div>
					<div>8. Guest: 50 000</div>
					<div>9. Guest: 40 000</div>
					<div>10. Guest: 30 000</div>
				</div> */}
			</div>
		</div>
	);
}
