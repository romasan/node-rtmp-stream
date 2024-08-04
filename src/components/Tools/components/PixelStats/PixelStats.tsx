import React, { FC, useState, useEffect } from 'react';

import cn from 'classnames';

import { Block } from '../Block';

import {
	get,
	getQuery,
} from '../../helpers';

import { formatTime } from '/src/helpers';

const saveToFile = (text, fileName, type = 'text/json') => {
	const blob = new Blob([text], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');

	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

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

	const ip = stats && stats.ip;
	const time = sortedLogins[0] ? formatTime(Date.now() - sortedLogins[0][0]) : '...';

	useEffect(() => {
		if (opened && typeof coord.x !== 'undefined') {
			get(getQuery('pixel', coord))
				.then(setStats)
				.catch(() => {/* */});
		}
	}, [coord, opened]);

	const backup = async () => {
		const data: any = {};

		const skips = (() => {return (window as any)['_skips'] || ['0:515']})();

		for (let x = 0; x < 720; x++) {
			for (let y = 0; y < 720; y++) {
				console.log('==== fetch', x, y);
				const key = `${x}:${y}`;

				if (skips.includes(key)) {
					console.log('==== skip', key);
					continue;
				}

				try {
					const json = await get(getQuery('pixel', { x, y }));
					data[key] = json;
				} catch (e) {
					console.log('==== error', x, y, e);
				}
			}
		}

		saveToFile(JSON.stringify(data), 'backup.json');
	};

	const content = (typeof x === 'undefined') ? 'Не выбран пиксель' : (
		<>
			{stats.errors && stats.errors.lengtht && stats.errors.map((text: string) => (
				<div key={text}>{text}</div>
			))}
			<div>
				Пиксель: {x}:{y} {stats.color || '...'}
			</div>
			<div>
				{formatTime(Date.now() - stats.time)} назад
			</div>
			<div>
				Ник: {stats.name || '...'}
			</div>
			<div>
				TOKEN: {stats.uuid || '...'}
			</div>
			<div>
				Первый вход: {time} назад
			</div>
			<div>
				IP: {ip || '...'} (City TODO)
			</div>
			<div>
				Забанен: ...
			</div>
			<div>
				<button disabled>Все сессии этого юзера TODO</button>
			</div>
			<div>
				<button disabled>Все IP этой сессии TODO</button>
			</div>
			<div>
				<button disabled>Все IP этого юзера TODO</button>
			</div>
			<div>
				<button disabled>Сессии с этим IP TODO</button>
			</div>
			<div>
				<button disabled>Заблокировать по сессии TODO</button>
			</div>
			<div>
				<button disabled>Заблокировать по нику TODO</button>
			</div>
			<div>
				<button disabled>Заблокировать по IP TODO</button>
			</div>
			<div>
				<button disabled>Таймаут TODO</button>
				<select>
					<option>полчаса</option>
					<option>час</option>
					<option>3 часа</option>
					<option>сутки</option>
					<option>неделя</option>
				</select>
			</div>
			<div>
				<button disabled>Выставить КД</button>
				<input size={6} />
			</div>
		</>
	);

	return (
		<Block title="❓ Чей пиксель" onToggle={setOpened}>
			{content}
			<hr />
			<button onClick={backup}>BACKUP</button>
		</Block>
	);
};
