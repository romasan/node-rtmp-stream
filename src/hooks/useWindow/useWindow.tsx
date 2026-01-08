import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useDraggable } from '../../hooks/useDraggable';

import * as s from './Window.module.scss';

interface Props {
	content: React.ReactElement;
	width?: string;
	height?: string;
	x?: number;
	y?: number;
	portal?: boolean;
	onClose?(): void;
}

export const useWindow = (props?: Props | React.ReactElement) => {
	const {
		content,
		width = '300px',
		height = '200px',
		x = 10,
		y = 50,
		portal,
		onClose,
	} = props as Props || {};
	const [visible, setVisible] = useState(false);
	const containerRef = useRef<any>(null);
	const [ready, setReady] = useState(false);

	const { anchorRef, draggableRef } = useDraggable({ x, y, ready });

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

	useEffect(() => {
		setTimeout(() => {
			setReady(visible);
		}, 0);
	}, [visible]);

	const render = () => {
		if (!visible) {
			return null;
		}

		const wrapper = (
			<div
				className={s.root}
				ref={draggableRef}
				style={{ width, height }}
			>
				<div className={s.draggable} ref={anchorRef}>
					<button className={s.close} onClick={close}>&times;</button>
				</div>
				<div>
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
