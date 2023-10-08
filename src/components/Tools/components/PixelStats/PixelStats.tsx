import React, { FC, useState, useMemo } from 'react';

import cn from 'classnames';

import { Block } from '../Block';

import {
	get,
	put,
	patch,
} from '../../helpers';

// import * as s from './Stats.module.scss';

interface Props {
}

export const PixelStats: FC<Props> = ({}) => {
	const [stats, setStats] = useState<any>({});

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

	return (
		<Block title="Чей пиксель">
			TODO
			<div>
				X:Y #fff 00:05 назад
			</div>
			<div>
				Первый вход: 5дн. 00:05 назад
			</div>
			<div>
				Guest
			</div>
			<div>
				<button>Все сессии этого юзера</button>
			</div>
			<div>
				TOKEN: 0000-000-0000000000
			</div>
			<div>
				<button>Все IP этой сессии</button>
			</div>
			<div>
				<button>Все IP этого юзера</button>
			</div>
			<div>
				IP: 0.0.0.0 (City)
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
}
