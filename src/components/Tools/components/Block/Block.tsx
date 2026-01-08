import React, { FC, PropsWithChildren, useRef, useMemo, useContext, useEffect } from 'react';
import cn from 'classnames';

import { v4 as uuid } from 'uuid';

import { ToolsContext } from '../../context';

import * as s from './Block.module.scss';

interface Props {
	id?: string;
	title: string;
	onOpen?: () => void;
	onClose?: () => void;
	onToggle?: (value: boolean) => void;
}

export const Block: FC<PropsWithChildren<Props>> = ({
	id,
	title,
	onOpen,
	onClose,
	onToggle,
	children,
}) => {
	const { opened, setOpened, wideWindow, renderRef } = useContext(ToolsContext);
	const first = useRef(true);

	const _id = useMemo(() => {
		return id || uuid();
	}, [id]);

	const isOpened = useMemo(() => opened === _id, [opened, _id]);

	useEffect(() => {
		if (isOpened) {
			if (onOpen) {
				onOpen();
			}
		} else {
			if (first.current) {
				first.current = false;
			} else {
				if (onClose) {
					onClose();
				}
			}
		}

		if (onToggle) {
			onToggle(isOpened);
		}
	}, [isOpened]);

	const toggle = () => {
		if (setOpened) {
			setOpened((value: string) => value === _id ? '' : _id);
		}
	};

	const render = () => (
		<div className={s.content}>
			{children}
		</div>
	);

	useEffect(() => {
		if (isOpened && typeof renderRef.current === 'function') {
			renderRef.current(render);
		}
	}, [render, isOpened]);

	return (
		<div className={s.root}>
			<div className={cn(s.title, { [s.active]: isOpened })} onClick={toggle}>
				{title}
			</div>
			{!wideWindow && isOpened && render()}
		</div>
	);
};
