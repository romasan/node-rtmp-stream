import React, { FC, useState, useMemo } from 'react';

import { Block } from '../Block';

import { get } from '../../helpers';

import { formatNumber } from '../../../../helpers';

import * as s from './Stats.module.scss';

interface Props {
	canvas: any;
}

export const Stats: FC<Props> = ({ canvas }) => {
	const [stats, setStats] = useState<any>({});
	const [list, setList] = useState<{ name: string; active: boolean; }[]>([]);

	const onOpen = () => {
		get('stats').then(setStats);
	};

	const onClose = () => {
		canvas.width = canvas.width;
	};

	const getList = (event: React.MouseEvent) => {
		event.preventDefault();

		get('onlineList').then(setList)
	}

	const agoLabel = useMemo(() => {
		const sec = Math.floor(stats.lastActivity / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);
		const day = Math.floor(hour / 24);
		const time = `${day ? `${day}d. ` : ''}${hour ? `${String(hour % 24).padStart(2, '0')}:` : ''}${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

		return time;
	}, [stats.lastActivity]);

	const drawPixel = (event: React.MouseEvent) => {
		event.preventDefault();

		const ctx = canvas.getContext('2d');

		ctx.fillStyle = '#f658b8';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = stats.color;
		ctx.fillRect(stats.coord.x, stats.coord.y, 1, 1);
	};

	return (
		<Block title="Общее" onOpen={onOpen} onClose={onClose}>
			{Boolean(stats.online) && (
				<div>
					Сессии: A {stats.online.countByActivity} / U {stats.online.uniq} / O {stats.online.open} / {stats.online.all}
					<div className={s.users}>
						<a href="#" onClick={getList}>Список</a>
						{list.map((item) => (
							<div key={String(item.name)}>
								{item.name} {item.active ? '*' : ''}
							</div>
						))}
					</div>
				</div>
			)}
			<div>
				Активность: {agoLabel} назад
			</div>
			{Boolean(stats.coord) && (
				<div>
					{stats.lastUserName} ({stats.lastUserUUID})
					<a href="#" onClick={drawPixel}>{stats.coord.x},{stats.coord.y} {stats.color}</a>
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
