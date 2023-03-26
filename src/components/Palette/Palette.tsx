import React, { FC } from 'react';

import s from './Palette.module.scss';

export const Palette: FC = () => {
	return (
		<div className={s.root} style={{ top: '300px', left: '100px' }}>
			Palette
		</div>
	);
}
