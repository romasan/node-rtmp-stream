import React, { useState } from 'react';

import cn from 'classnames';

import { Chat } from '../Chat';
import { Info } from '../Info';

import { ERole } from '../../hooks';

import ChatIcon from '/assets/chat.svg';
import LoginIcon from '/assets/login.svg';
import LogoutIcon from '/assets/logout.svg';
import TimelapseIcon from '/assets/clock.svg';
import InfoIcon from '/assets/info.svg';
import GearIcon from '/assets/gear.svg';

import * as s from './Header.module.scss';

interface Props {
	isAuthorized: boolean;
	name?: string;
	isOnline: boolean;
	hasNewMessage: boolean;
	blinkedLoginAnimation?: boolean;
	setHasNewMessage: (value: boolean) => void;
	role: ERole;
	login: () => void;
	[key: string]: any;
}

export const Header: React.FC<Props> = ({
	isAuthorized,
	name,
	isOnline,
	hasNewMessage,
	blinkedLoginAnimation,
	setHasNewMessage,
	role,
	login,
}) => {
	const [chatIsShowed, setChatIsShowed] = useState(false);
	const [infoIsShowed, setInfoIsShowed] = useState(false);

	const toggleChat = () => {
		setHasNewMessage(false);
		setChatIsShowed((value) => !value);
	};

	const toggleInfo = () => {
		setInfoIsShowed((value) => !value);
	};

	return (
		<>
			<div className={s.root}>
				<a href="/" className={s.title}>
					<h1>PIXEL BATTLE</h1>
					<h2>Пиксель батл 2024 S2E2</h2>
				</a>
				<div className={s.controls}>
					{isAuthorized ? (
						<>
							<div className={s.userName}>
								{name}
							</div>
							<a href="/logout" className={cn({[s.disabled]: !isOnline})} aria-label="Выход">
								<LogoutIcon />
							</a>
						</>
					) : (
						<LoginIcon onClick={login} className={cn(s.iconButton, {[s.disabled]: !isOnline, [s.blinked]: blinkedLoginAnimation})} aria-label="Выход" />
					)}
					<span className={cn(s.iconWrapper, { [s.badge]: hasNewMessage && !chatIsShowed })}>
						<ChatIcon className={s.iconButton} onClick={toggleChat} aria-label="Чат" />
					</span>
					<InfoIcon className={s.iconButton} onClick={toggleInfo} aria-label="Статистика" />
					<a href="/timelapse" aria-label="Таймлапс">
						<TimelapseIcon />
					</a>
					{role === ERole.moderator && (
						<a href="/qq" aria-label="tools">
							<GearIcon />
						</a>
					)}
				</div>
			</div>
			{chatIsShowed && (
				<Chat
					isAuthorized={isAuthorized}
					nickname={name}
					onClose={toggleChat}
				/>
			)}
			{infoIsShowed && (
				<Info onClose={toggleInfo} />
			)}
		</>
	);
};
