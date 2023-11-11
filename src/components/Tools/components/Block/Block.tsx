import React, { FC, PropsWithChildren, useRef, useMemo, useContext, useEffect } from 'react';

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

export const Block: FC<PropsWithChildren<Props>> = ({ id, title, onOpen, onClose, onToggle, children }) => {
	const { opened, setOpened } = useContext(ToolsContext);
	const first = useRef(true);

	const _id = useMemo(() => {
		return id || uuid();
	}, [id]);

	const isOpened = opened === _id;

	useEffect(() => {
		if (isOpened) {
			onOpen?.();
		} else {
			if (first.current) {
				first.current = false;
			} else {
				onClose?.();
			}
		}

		onToggle?.(isOpened);
	}, [isOpened]);

	const toggle = () => {
		setOpened?.((value: string) => value === _id ? '' : _id);
	};

	return (
		<div className={s.root}>
			<div className={s.title} onClick={toggle}>
				{title}
			</div>
			{isOpened && (
				<div className={s.content}>{children}</div>
			)}
		</div>
	);
};
