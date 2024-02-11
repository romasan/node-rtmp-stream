import React, { useState } from 'react';

import * as s from './Modal.module.scss';

interface Props {
	content: React.ReactElement;
	width?: string;
	height?: string;
	onClose?(): void;
}

export const useModal = (props?: Props | React.ReactElement) => {
	const {
		content,
		onClose,
		width,
		height,
	} = props as Props || {};
	const [visible, setVisible] = useState(false);

	const close = () => {
		onClose?.();
		setVisible(false);
	};

	const open = () => {
		setVisible(true);
	};

	const render = () => visible ? (
		<div className={s.root}>
			<div className={s.window} style={{ width, height }}>
				<div className={s.close} onClick={close}>&times;</div>
				{content || props}
			</div>
		</div>
	) : null;

	return {
		render,
		open,
		close,
	};
};
