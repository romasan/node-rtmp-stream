import React, { FC, useState, useEffect } from 'react';

import cn from 'classnames';

import * as s from './Countdown.module.scss';

interface Props {
	finish: number;
	text: string;
}

export const Countdown: FC<Props> = ({ finish, text }) => {
	const [countdown, setCountdown] = useState(0);
	useEffect(() => {
		setCountdown(finish - Date.now());

		const timer = setInterval(() => {
			setCountdown(finish - Date.now());

			if (finish - Date.now() < 0) {
				clearInterval(timer);
			}
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, [finish]);

	const renderTime = () => {
		const sec = Math.floor(countdown / 1000);
		const min = Math.floor(sec / 60);
		const hour = Math.floor(min / 60);
		const day = Math.floor(hour / 24);

		return `${day ? `${day} д. ` : ''}${hour ? `${String(hour % 24).padStart(2, '0')}:` : ''}${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
	};

	if (countdown < 0) {
		return (
			<div className={cn(s.root, s.timeout)}>
				{text || 'TIMEOUT'}
			</div>
		);
	}

	return (
		<div className={s.root}>
			{renderTime()}
		</div>
	);
};
