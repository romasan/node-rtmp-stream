import React, { FC, useState, useEffect } from 'react';

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
							<div>ТОП участников:</div>
							<div>&nbsp;</div>
							{(stats?.leaderboard || []).map((item) => (
								<div key={String(item.place)} className={s.leaderBoardItem}>
									<span>
										{item.place < 10 && <>&nbsp;</>}
										{item.place}.
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
};
