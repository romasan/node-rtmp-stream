import React, { FC } from 'react';

import s from './Palette.module.scss';

export const Palette: FC = () => {
	return (
		<div className={s.root} style={{ top: '300px', left: '100px' }}>
			<div className={s.draggable}></div>
			<div className={s.currentColor}></div>
			<div className={s.colors}>
				{[
					'#ff0000', '#00ff00', '#0000ff',
					'#ff0000', '#00ff00', '#0000ff',
					'#ff0000', '#00ff00', '#0000ff',
					'#ff0000', '#00ff00', '#0000ff',
					'#ff0000', '#00ff00', '#0000ff',
					'#ff0000', '#00ff00', '#0000ff',
				].map((color) => (
					<div className={s.color} style={{ background: color }}></div>
				))}
			</div>
		</div>
	);
}
