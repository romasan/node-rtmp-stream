import React, { FC, PropsWithChildren } from 'react';

import s from './Modal.module.scss';

interface Props {
	onClose(): void;
}

export const Modal: FC<PropsWithChildren<Props>> = ({
	children,
	onClose,
}) => {
	return (
		<div className={s.root}>
			<div className={s.window}>
				<div className={s.close} onClick={onClose}>&times;</div>
				{children}
			</div>
		</div>
	);
}
