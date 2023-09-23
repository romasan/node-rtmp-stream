import React, { FC, PropsWithChildren, useMemo, useRef, useState, useEffect, useContext } from 'react';

import cn from 'classnames';

import { v4 as uuid } from 'uuid';

import { ToolsContext } from '../../context';

import * as s from './Block.module.scss';

interface Props {
	id?: string;
	title: string;
}

export const Block: FC<PropsWithChildren<Props>> = ({ id, title, children }) => {
	const { opened, setOpened } = useContext(ToolsContext);

	const _id = useMemo(() => {
		return id || uuid();
	}, [id]);

	const isOpened = opened === _id;

	const toggle = () => {
		setOpened?.((value: string) => value === _id ? '' : _id);
	};

	return (
		<div className={cn(s.root, { [s.opened]: isOpened })}>
			<div onClick={toggle}>
				{title}
			</div>
			{isOpened && (
				<div>{children}</div>
			)}
		</div>
	);
}
