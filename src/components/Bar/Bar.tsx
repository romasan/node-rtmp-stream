import React, { FC } from 'react';

import s from './Bar.module.scss';

interface Props {
	onDraw(): void;
	onPlus(): void;
	onMinus(): void;
}

export const Bar: FC<Props> = ({
	onDraw,
	onPlus,
	onMinus,
}) => {
	return (
		<div className={s.root}>
			<button className={s.button} onClick={onDraw}>
				<svg className={s.icon} version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 440"><path d="M320 20v20h-40v40h-40v40h-40v40h-40v40h-40v40H80v40H40v40H0v120h120v-40h40v-40h40v-40h40v-40h40v-40h40v-40h40v-40h40v-40h40V80h-40V40h-40V0h-40v20zm40 40v20h40v40h-40v40h-40v40h-40v40h-40v40h-40v40h-40v40h-40v40H80v-40H40v-40h40v-40h40v-40h40v-40h40v-40h40v-40h40V80h40V40h40v20z"/><path d="M280 140v20h40v-40h-40v20z"/></svg>
			</button>
			<button className={s.button} onClick={onPlus}>
				<svg className={s.icon} version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 440"><path d="M160 100v60H40v120h120v120h120V280h120V160H280V40H160v60zm80 40v60h120v40H240v120h-40V240H80v-40h120V80h40v60z"/></svg>
			</button>
			<button className={s.button} onClick={onMinus}>
				<svg className={s.icon} version="1.0" xmlns="http://www.w3.org/2000/svg" width="586.667" height="586.667" viewBox="0 0 440 440"><path d="M40 220v60h360V160H40v60zm320 0v20H80v-40h280v20z"/></svg>
			</button>
		</div>
	);
}
