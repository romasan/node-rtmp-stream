import React, { FC } from 'react';

import mobile from 'is-mobile';

import { useDraggable } from '../../hooks/useDraggable';

import s from './Palette.module.scss';

interface Props {
	color: string;
	colors: any;
	setColor(value: string): void;
}

export const Palette: FC<Props> = ({ color, colors, setColor }) => {
	const isMobile = mobile();

	const { anchorRef, draggableRef } = useDraggable({ x: 20, y: window.innerHeight - 100, ready: !isMobile });

	return (
		<div className={s.root} ref={draggableRef}>
			{!isMobile && <div className={s.draggable} ref={anchorRef}></div>}
			<div className={s.paletteContent}>

				<div className={s.paletteControls}>
					<div className={s.currentColorWrapper}>
						<div className={s.currentColor} style={{ background: colors[color]}}></div>
					</div>
					<div className={s.colors}>
						{Object.entries(colors).map(([key, color]) => (
							<div
								key={key}
								className={s.color}
								style={{ background: color as string }}
								onClick={() => setColor(key)}
							/>
						))}
					</div>
				</div>

				<div className={s.cooldown}>
					<div className={s.progress} style={{ width: '100%'}}></div>
				</div>

			</div>
		</div>
	);
}
