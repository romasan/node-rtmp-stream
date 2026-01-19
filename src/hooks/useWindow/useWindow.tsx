import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
// import { createPortal } from 'react-dom';

import { useDraggable } from '../../hooks/useDraggable';

import * as s from './Window.module.scss';

interface IProps {
	content: React.ReactElement;
	width?: string;
	height?: string;
	x?: number;
	y?: number;
	// portal?: boolean;
	onClose?(): void;
}

const Wrapper = ({
	width = '300px',
	height = '200px',
	x = 10,
	y = 50,
	content,
	onClose,
}: IProps) => {
	const { anchorRef, draggableRef } = useDraggable({ x, y });

	return (
		<div
			className={s.root}
			ref={draggableRef}
			style={{ width, height }}
		>
			<div className={s.draggable} ref={anchorRef}>
				<button className={s.close} onClick={onClose}>&times;</button>
			</div>
			<div className={s.content}>
				{content}
			</div>
		</div>
	);
};

export const useWindows = (): any => {
	const [windows, setWindows] = useState({});
	const [trigger, setTrigger] = useState(1);
	const update = () => setTrigger((v) => v + 1);

	const newWindow = ({
		content,
		width = '300px',
		height = '200px',
		x = 10,
		y = 50,
		onClose,
	}: any): any => {
		const id = uuid();
		console.log('==== newWindow', id);
		const close = () => {
			console.log('==== close', {
				id,
				windows,
				onClose,
			});
			setWindows((list) => {
				delete (list as any)[id];
				update();

				return list;
			});
			if (onClose) {
				onClose();
			}
		};
		setWindows((list) => ({
			...list,
			[id]: (
				<Wrapper
					key={id}
					x={x}
					y={y}
					width={width}
					height={height}
					content={content}
					onClose={close}
				/>
			),
		}));

		return null;
	};

	const windowsRender = () => {
		console.log('==== windowsRender', { windows, trigger });
		return trigger && Object.values(windows);
	};

	return {
		newWindow,
		windowsRender,
	};
};

export const useWindow = (props?: IProps | React.ReactElement) => {
	const {
		content,
		width = '300px',
		height = '200px',
		x = 10,
		y = 50,
		// portal,
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

	// useEffect(() => {
	// 	if (portal && !containerRef.current) {
	// 		containerRef.current = document.createElement('div');
	// 		document.body.appendChild(containerRef.current);
	// 	}

	// 	return () => {
	// 		if (portal && containerRef.current) {
	// 			containerRef.current.remove();
	// 			containerRef.current = null;
	// 		}
	// 	};
	// }, [portal]);

	useEffect(() => {
		setTimeout(() => {
			setReady(visible);
		}, 0);
	}, [visible]);

	const render = () => {
		if (!visible) {
			return null;
		}

		return (
			<div
				className={s.root}
				ref={draggableRef}
				style={{ width, height }}
			>
				<div className={s.draggable} ref={anchorRef}>
					<button className={s.close} onClick={close}>&times;</button>
				</div>
				<div className={s.content}>
					{content || props}
				</div>
			</div>
		);

		// return portal ? createPortal(wrapper, containerRef.current) : wrapper;
	};

	return {
		render,
		open,
		close,
		toggle,
	};
};
