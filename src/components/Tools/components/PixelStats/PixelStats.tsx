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
	const [stats, setStats] = useState<any>({});

	const { x, y } = coord || {};

	// const onChangeFreeze = (event: any) => {
	// 	setCanvasConf((value: any) => ({ ...value, freezed: event.target.value === 'true' }));
	// 	patch('streamSettings', JSON.stringify({ ...canvasConf, freezed: event.target.value === 'true' }), 'TEXT');
	// };

	// const updateFreezedFrame = () => {
	// 	put('updateFreezedFrame', null, 'TEXT');
	// };

	const onOpen = () => {
		// get('stats').then(setStats);
	};

	const sortedLogins = stats.logins
		? stats.logins.sort(([a], [b]) => a > b ? 1 : 0)
		: [];

	const ip = sortedLogins[sortedLogins.length - 1] && sortedLogins[sortedLogins.length - 1][1];
	const time = sortedLogins[0] ? formatTime(Date.now() - sortedLogins[0][0]) : '...';

	useEffect(() => {
		if (typeof coord.x !== 'undefined') {
			get(getQuery('pixel', coord))
				.then(setStats)
				.catch(() => {/* */});
		}
	}, [coord]);

	return (
		<Block title="Чей пиксель">
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
				<button>Все сессии этого юзера</button>
			</div>
			<div>
				TOKEN: {stats.uuid || '...'}
			</div>
			<div>
				<button>Все IP этой сессии</button>
			</div>
			<div>
				<button>Все IP этого юзера</button>
			</div>
			<div>
				IP: {ip || '...'} (City)
			</div>
			<div>
				<button>Сессии с этим IP</button>
			</div>
			<div>
				<button>Заблокировать по сессии</button>
			</div>
			<div>
				<button>Заблокировать по нику</button>
			</div>
			<div>
				<button>Заблокировать по IP</button>
			</div>
			<div>
				<button>Таймаут</button>
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
