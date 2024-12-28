import React, { useRef, useEffect, useState } from 'react';
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
		width,
		height,
		portal,
		onClose,
	} = props as Props || {};
	const [visible, setVisible] = useState(false);
	const containerRef = useRef<any>(null);

	const close = () => {
		onClose && onClose();
		setVisible(false);
	};

	const open = () => {
		setVisible(true);
	};

	const toggle = () => {
		setVisible((value) => !value);
	};

	useEffect(() => {
		if (!containerRef.current) {
			containerRef.current = document.createElement('div');
			document.body.appendChild(containerRef.current);
		}

		return () => {
			if (containerRef.current) {
				containerRef.current.remove();
				containerRef.current = null;
			}
		};
	}, []);

	const render = () => {
		if (!visible) {
			return null;
		}
		const wrapper = (
			<div className={s.root}>
				<div className={s.window} style={{ width, height }}> 
					<div className={s.close} onClick={close}>&times;</div>
					{content || props}
				</div>
			</div>
		);

		return portal ? createPortal(wrapper, containerRef.current) : wrapper;
	};

	return {
		render,
		open,
		close,
		toggle,
	};
};
