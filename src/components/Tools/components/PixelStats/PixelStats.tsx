import React, { FC, useState, useEffect } from 'react';

import cn from 'classnames';

import { Block } from '../Block';

import {
	get,
	getQuery,
} from '../../helpers';

import { formatTime } from '../../../../helpers';

// import * as s from './Stats.module.scss';

interface Props {
	coord: {
		x: number;
		y: number;
	}
}

export const PixelStats: FC<Props> = ({ coord }) => {
	const [opened, setOpened] = useState(false);
	const [stats, setStats] = useState<any>({});

	const { x, y } = coord || {};

	const sortedLogins = stats.logins
		? stats.logins.sort(([a]: [number], [b]: [number]) => a > b ? 1 : 0)
		: [];

	const ip = stats?.ip;
	const time = sortedLogins[0] ? formatTime(Date.now() - sortedLogins[0][0]) : '...';

	useEffect(() => {
		if (opened && typeof coord.x !== 'undefined') {
			get(getQuery('pixel', coord))
				.then(setStats)
				.catch(() => {/* */});
		}
	}, [coord, opened]);

	return (
		<Block title="Чей пиксель" onToggle={setOpened}>
			{stats.errors && stats.errors.lengtht && stats.errors.map((text: string) => (
				<div key={text}>{text}</div>
			))}
			<div>
				{x}:{y} {stats.color || '...'} {formatTime(Date.now() - stats.time)} назад
			</div>
			<div>
				Первый вход: {time} назад
			</div>
			<div>
				{stats.name || '...'}
			</div>
			<div>
				TOKEN: {stats.uuid || '...'}
			</div>
			<div>
				IP: {ip || '...'} (City TODO)
			</div>
			<div>
				BANNED: ...
			</div>
			<div>
				<button>Все сессии этого юзера TODO</button>
			</div>
			<div>
				<button>Все IP этой сессии TODO</button>
			</div>
			<div>
				<button>Все IP этого юзера TODO</button>
			</div>
			<div>
				<button>Сессии с этим IP TODO</button>
			</div>
			<div>
				<button>Заблокировать по сессии TODO</button>
			</div>
			<div>
				<button>Заблокировать по нику TODO</button>
			</div>
			<div>
				<button>Заблокировать по IP TODO</button>
			</div>
			<div>
				<button>Таймаут TODO</button>
				<select>
					<option>полчаса</option>
					<option>час</option>
					<option>3 часа</option>
					<option>сутки</option>
					<option>неделя</option>
				</select>
			</div>
		</Block>
	);
};
