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

import * as s from './HeaderControls.module.scss';

interface Props {
	isAuthorized: boolean;
	name?: string;
	isOnline: boolean;
	hasNewMessage: boolean;
	blinkedLoginAnimation?: boolean;
	setHasNewMessage: (value: boolean) => void;
	role: ERole;
	login: () => void;
}

export const HeaderControls: React.FC<Props> = ({
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
				<div className={s.controlsWrapper}>
					{isAuthorized && (
						<div className={s.userName}>
							{name}
						</div>
					)}
					<div className={s.controls}>
						{isAuthorized ? (
							<a href="/logout" className={cn({[s.disabled]: !isOnline})} title="Выход">
								<LogoutIcon className={s.iconButton} />
							</a>
						) : (
							<LoginIcon onClick={login} className={cn(s.iconButton, {[s.disabled]: !isOnline, [s.blinked]: blinkedLoginAnimation})} title="Выход" />
						)}
						<span className={cn(s.iconWrapper, { [s.badge]: hasNewMessage && !chatIsShowed })}>
							<ChatIcon className={s.iconButton} onClick={toggleChat} title="Чат" />
						</span>
						<InfoIcon className={s.iconButton} onClick={toggleInfo} title="Статистика" />
						<a href="/timelapse" title="Таймлапс">
							<TimelapseIcon className={s.iconButton} />
						</a>
						{role === ERole.moderator && (
							<a href="/qq" title="Tools">
								<GearIcon className={s.iconButton} />
							</a>
						)}
					</div>
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
