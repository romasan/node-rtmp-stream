import React, { FC, useState, useMemo } from 'react';

import { Block } from '../Block';

import { get } from '../../helpers';

import { formatNumber } from '../../../../helpers';

interface Props {
}

export const Stats: FC<Props> = ({}) => {
	const [stats, setStats] = useState<any>({});

	const onOpen = () => {
		get('stats').then(setStats);
	};

	const agoLabel = useMemo(() => {
		const sec = Math.floor(stats.lastActivity / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);
		const day = Math.floor(hour / 24);
		const time = `${day ? `${day}d. ` : ''}${hour ? `${String(hour % 24).padStart(2, '0')}:` : ''}${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

		return time;
	}, [stats.lastActivity]);

	return (
		<Block title="Общее" onOpen={onOpen}>
			{Boolean(stats.online) && (
				<div>
					Сессии: {stats.online.uniq} / {stats.online.open} / {stats.online.all}
					<a href="#">Список TODO</a>
				</div>
			)}
			<div>
				Активность: {agoLabel} назад
			</div>
			{Boolean(stats.coord) && (
				<div>
					{stats.lastUserName} ({stats.lastUserUUID}) {stats.coord.x}:{stats.coord.y} {stats.color};
				</div>
			)}
			<div>
				Всего пикселей: {formatNumber(stats.total)}
			</div>
			{/* <div>
				Uptime: 999 д. 01:02:03
			</div> */}
		</Block>
	);
};
