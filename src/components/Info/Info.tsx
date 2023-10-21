import React, { FC, useRef, useState, useEffect } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import { getStats } from '../../lib/api';

import { formatNumber } from '../../helpers';

import * as s from './Info.module.scss';

interface Props {
	onClose: Function;
}

interface IMessage {
	id: string;
	time: number;
	text: string;
	name: string;
	avatar: string;
}

export const Info: FC<Props> = ({
	onClose,
	...props,
}) => {
	const [stats, setStats] = useState({
		loading: true,
	});
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 280, y: 60});

	useEffect(() => {
		getStats().then(setStats).catch(() => {});
	}, []);

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}>
				<button className={s.close} onClick={onClose}>&times;</button>
			</div>
			<div className={s.content} {...props}>
				{stats?.loading ? (
					<div>Загрузка...</div>
				) : (
					<div>
						{/* <div>Online: 0</div> */}
						<div>Всего пикселей: {formatNumber(stats?.total)}</div>
						<div>&nbsp;</div>
						<div>
							<div>ТОП 10 участников:</div>
							<div>&nbsp;</div>
							{(stats?.leaderboard || []).map((item, index) => (
								<div key={String(index)} className={s.leaderBoardItem}>
									<span>
										{index < 9 && <>&nbsp;</>}
										{index + 1}.
										{item.name}
									</span>
									<span>
										{formatNumber(item.count)}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
