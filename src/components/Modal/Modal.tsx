import React, { FC, PropsWithChildren } from 'react';

import s from './Modal.module.scss';

interface Props {
	onClose(): void;
	width?: string;
	height?: string;
}

export const Modal: FC<PropsWithChildren<Props>> = ({
	children,
	onClose,
	width = '500px',
	height = '350px',
}) => {
	return (
		<div className={s.root}>
			<div className={s.window} style={{ width, height }}>
				<div className={s.close} onClick={onClose}>&times;</div>
				{children}
			</div>
		</div>
	);
}
