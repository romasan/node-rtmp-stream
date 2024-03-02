import React, {useEffect, useState} from 'react';
import { createPortal } from 'react-dom';

import * as s from './Modal.module.scss';

interface Props {
	content: React.ReactElement;
	width?: string;
	height?: string;
	portal?: boolean;
	onClose?(): void;
}

export const useModal = (props?: Props | React.ReactElement) => {
	const {
		content,
		onClose,
		width,
		height,
		portal,
	} = props as Props || {};
	const [visible, setVisible] = useState(false);

	const close = () => {
		onClose && onClose();
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

	useEffect(() => {
		if (portal && visible) {
			const container = document.createElement('div');

			document.body.appendChild(container);
			createPortal(render(), container);

			return () => {
				container.remove();
			};
		}
	}, [portal, visible]);

	return {
		render,
		open,
		close,
	};
};
