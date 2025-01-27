import React from 'react';

import LogoIcon from '/assets/logo.svg';

const { year, episode } = require('../../constants.json');

import * as s from './HeaderLogo.module.scss';

export const HeaderLogo: React.FC = () => {
	return (
		<>
			<div className={s.root}>
				<a href="/" className={s.title} aria-label="PIXEL BATTLE">
					<LogoIcon className={s.logo} />
					<h1>PIXEL BATTLE</h1>
					<h2>Пиксель батл {year} {episode}</h2>
				</a>
			</div>
		</>
	);
};
