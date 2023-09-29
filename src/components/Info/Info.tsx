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
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 240, y: 60});

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
					<div>Loading...</div>
				) : (
					<div>
						{/* <div>Online: 0</div> */}
						<div>Total pixels: {formatNumber(stats?.total)}</div>
						<div>
							<div>Leaderboard</div>
							{(stats?.leaderboard || []).map((item, index) => (
								<div key={String(index)}>
									{index < 9 && <>&nbsp;</>}
									{index + 1}.
									{item.name}:
									{formatNumber(item.count)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
