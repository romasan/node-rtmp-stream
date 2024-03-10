import { useEffect, useState, createPortal } from 'preact/compat';

import * as s from './Modal.module.scss';

interface Props {
	content: any;
	width?: string;
	height?: string;
	portal?: boolean;
	onClose?(): void;
}

export const useModal = (props?: Props) => {
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
			createPortal(render(), container!);

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
