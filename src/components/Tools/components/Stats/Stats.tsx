import React, { FC, useState, useMemo } from 'react';

import { Block } from '../Block';

import { get } from '../../helpers';

import { formatNumber, formatTime } from '../../../../helpers';

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

	const drawPixel = (event: React.MouseEvent) => {
		event.preventDefault();

		const ctx = canvas.getContext('2d');

		ctx.fillStyle = '#f658b8';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = '#000';
		ctx.fillRect(stats.coord.x - 1, stats.coord.y - 1, 1, 1);
		ctx.fillRect(stats.coord.x - 2, stats.coord.y - 2, 1, 1);

		ctx.fillRect(stats.coord.x - 1, stats.coord.y + 1, 1, 1);
		ctx.fillRect(stats.coord.x - 2, stats.coord.y + 2, 1, 1);

		ctx.fillRect(stats.coord.x + 1, stats.coord.y - 1, 1, 1);
		ctx.fillRect(stats.coord.x + 2, stats.coord.y - 2, 1, 1);

		ctx.fillRect(stats.coord.x + 1, stats.coord.y + 1, 1, 1);
		ctx.fillRect(stats.coord.x + 2, stats.coord.y + 2, 1, 1);

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
				Активность: {formatTime(stats.lastActivity)} назад
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
			<div>
				Uptime: {formatTime(stats.uptime)}
			</div>
		</Block>
	);
};
