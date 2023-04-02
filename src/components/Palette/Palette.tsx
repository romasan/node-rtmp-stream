import React, { FC } from 'react';
import { useDraggable } from '../../hooks/useDraggable';

import s from './Palette.module.scss';

export const Palette: FC = () => {
	const { anchorRef, draggableRef } = useDraggable({ x: 30, y: window.innerHeight - 160});
	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}></div>
			<div className={s.paletteContent}>

				<div className={s.paletteControls}>
					<div className={s.currentColorWrapper}>
						<div className={s.currentColor}></div>
					</div>
					<div className={s.colors}>
						{[
							// '#ff0000', '#00ff00', '#0000ff',
							// '#ff0000', '#00ff00', '#0000ff',
							// '#ff0000', '#00ff00', '#0000ff',
							// '#ff0000', '#00ff00', '#0000ff',
							// '#ff0000', '#00ff00', '#0000ff',
							// '#ff0000',
							'#e2d747',
							'#a5dd5f',
							'#56ba37',
							'#5fcfdb',
							'#3681c1',
							'#091de0',
							'#c276de',
							'#77197c',
							'#ffffff',
							'#e4e4e4',
							'#888888',
							'#000000',
							'#f1aacf',
							'#d22d1f',
							'#db9834',
							'#976c49',
						].map((color) => (
							<div key={color} className={s.color} style={{ background: color }}></div>
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
