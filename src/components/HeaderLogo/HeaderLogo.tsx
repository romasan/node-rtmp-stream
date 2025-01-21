import React from 'react';

import LogoIcon from '/assets/logo.svg';

import * as s from './HeaderLogo.module.scss';

export const HeaderLogo: React.FC = () => {
	return (
		<>
			<div className={s.root}>
				<a href="/" className={s.title}>
					<LogoIcon className={s.logo} />
					<h1>PIXEL BATTLE</h1>
					<h2>Пиксель батл 2025 S3E1</h2>
				</a>
			</div>
		</>
	);
};
