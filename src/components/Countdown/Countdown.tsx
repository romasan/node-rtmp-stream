import React, { FC, useState, useEffect } from 'react';

import cn from 'classnames';

import * as s from './Countdown.module.scss';
import { formatTime } from '../../helpers';

interface Props {
	finish: number;
	text: string;
}

const renderText = (raw: string, nickname?: string): string => {
	return raw
		.replace(/\(([a-zA-Zа-яА-Я0-9\ ]+)\)\[(http[s]{0,1}\:\/\/[a-zA-Z0-9\-\/\.]+)\]/ig, '<a href="$2">$1</a>')
};

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

	const renderTime = () => formatTime(countdown);

	if (countdown < 0) {
		return (
			<div className={cn(s.root, s.timeout)} dangerouslySetInnerHTML={{ __html: text ? renderText(text) : 'TIMEOUT' }}></div>
		);
	}

	return (
		<div className={s.root}>
			{renderTime()}
		</div>
	);
};
