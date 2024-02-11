import React, { useState } from 'react';

import cn from 'classnames';

import { Chat } from '../Chat';
import { Info } from '../Info';

import { ERole, useModal } from '../../hooks';

import ChatIcon from '../../../assets/chat.svg';
import LoginIcon from '../../../assets/login.svg';
import LogoutIcon from '../../../assets/logout.svg';
import TimelapseIcon from '../../../assets/timeline.svg';
import InfoIcon from '../../../assets/info.svg';
import GearIcon from '../../../assets/gear.svg';

import TwitchIcon from '../../../assets/twitch.svg';
import DiscordIcon from '../../../assets/discord.svg';
import SteamIcon from '../../../assets/steam.svg';

import * as s from './Header.module.scss';

interface Props {
	isAuthorized: boolean;
	name?: string;
	isOnline: boolean;
	hasNewMessage: boolean;
	blinkedLoginAnimation?: boolean;
	setHasNewMessage: (value: boolean) => void;
	role: ERole;
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
	...rest
}) => {
	const [chatIsShowed, setChatIsShowed] = useState(false);
	const [infoIsShowed, setInfoIsShowed] = useState(false);

	const loginModal = useModal({
		content: (
			<>
				<div className={s.loginTitle}>Войти с помощью</div>
				<div className={s.loginList}>
					<a href="/login/?twitch">
						<TwitchIcon />
						Twitch
					</a>
					<a href="/login/?discord">
						<DiscordIcon />
						Discord
					</a>
					<a href="/login/?steam">
						<SteamIcon />
						Steam
					</a>
				</div>
			</>
		),
		width: '300px',
	});

	const handleLogin = () => {
		loginModal.open();
	};

	const toggleChat = () => {
		setHasNewMessage(false);
		setChatIsShowed((value) => !value);
	};

	const toggleInfo = () => {
		setInfoIsShowed((value) => !value);
	};

	return (
		<>
			<div className={s.root} {...rest}>
				<a href="/" className={s.title}>
					<h1>PIXEL BATTLE</h1>
					<h2>Пиксель батл 2024 S2E1</h2>
				</a>
				<div className={s.controls}>
					{isAuthorized ? (
						<>
							<div className={s.userName}>
								{name}
							</div>
							<a href="/logout" className={cn({[s.disabled]: !isOnline})} aria-label="Выход">
								<LogoutIcon/>
							</a>
						</>
					) : (
						<LoginIcon onClick={handleLogin} className={cn(s.iconButton, {[s.disabled]: !isOnline})} aria-label="Выход" />
					)}
					<span className={cn(s.iconWrapper, { [s.badge]: hasNewMessage && !chatIsShowed })}>
						<ChatIcon className={s.iconButton} onClick={toggleChat} aria-label="Чат" />
					</span>
					<InfoIcon className={s.iconButton} onClick={toggleInfo} aria-label="Статистика" />
					<a href="/timelapse" aria-label="Таймлапс">
						<TimelapseIcon />
					</a>
					{role === ERole.moderator && (
						<a href="/qq">
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
					{...rest}
				/>
			)}
			{infoIsShowed && (
				<Info onClose={toggleInfo} {...rest} />
			)}
			{loginModal.render()}
		</>
	);
};
