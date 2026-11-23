import cn from 'classnames';
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import * as s from './Modal.module.scss';

interface Props {
	content: React.ReactElement;
	title?: string;
	resizable?: boolean;
	width?: string;
	height?: string;
	portal?: boolean;
	onClose?(): void;
}

export const useModal = (props?: Props | React.ReactElement) => {
	const {
		content,
		title,
		resizable,
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
		if (portal && !containerRef.current) {
			containerRef.current = document.createElement('div');
			document.body.appendChild(containerRef.current);
		}

		return () => {
			if (portal && containerRef.current) {
				containerRef.current.remove();
				containerRef.current = null;
			}
		};
	}, [portal]);

	const render = () => {
		if (!visible) {
			return null;
		}

		const wrapper = (
			<div className={s.root}>
				<div className={cn(s.window, { [s.resizable]: resizable, [s.withTitle]: title })} style={{ width, height }} role="dialog" aria-modal="true" aria-label={title || 'Информация'}>
					{title && <div className={s.header}>{title}</div>}
					<button type="button" className={s.close} onClick={close} aria-label="Закрыть окно">&times;</button>
					<div className={s.body}>{content || props}</div>
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
