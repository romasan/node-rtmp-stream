import React, { FC, useState, useMemo } from 'react';

import cn from 'classnames';

import { Block } from '../Block';

import {
	get,
	put,
	patch,
} from '../../helpers';

import { formatNumber } from '../../../../helpers';

// import * as s from './Stats.module.scss';

interface Props {
}

export const Stats: FC<Props> = ({}) => {
	const [stats, setStats] = useState<any>({});

	const onOpen = () => {
		get('stats').then(setStats);
	};

	const agoLabel = useMemo(() => {
		const sec = Math.floor(stats?.lastActivity / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);
		const day = Math.floor(hour / 24);
		const time = `${day ? `${day}d. ` : ''}${hour ? `${String(hour % 24).padStart(2, '0')}:` : ''}${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

		return time;
	}, [stats?.lastActivity]);

	return (
		<Block title="Общее" onOpen={onOpen}>
			<div>
				Сессии: {stats?.online?.uniq ?? -1} / {stats?.online?.open ?? -1} / {stats?.online?.all ?? -1}
			</div>
			<div>
				Активность: {agoLabel} назад
			</div>
			<div>
				{stats.lastUserName} ({stats?.lastUserUUID}) {stats?.coord?.x}:{stats?.coord?.y} {stats?.color};
			</div>
			<div>
				Total: {formatNumber(stats.total)}
			</div>
			{/* <div>
				Uptime: 999 д. 01:02:03
			</div> */}
		</Block>
	);
}
