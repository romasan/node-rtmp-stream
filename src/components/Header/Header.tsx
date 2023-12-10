import React, { useState } from 'react';

import cn from 'classnames';

import { Chat } from '../Chat';
import { Info } from '../Info';

import ChatIcon from '../../../assets/chat.svg';
import LoginIcon from '../../../assets/login.svg';
import LogoutIcon from '../../../assets/logout.svg';
import InfoIcon from '../../../assets/info.svg';

import * as s from './Header.module.scss';

interface Props {
	isAuthorized: boolean;
	name?: string;
	isOnline: boolean;
	hasNewMessage: boolean;
	blinkedLoginAnimation?: boolean;
	setHasNewMessage: (value: boolean) => void;
	[key: string]: any;
}

export const Header: React.FC<Props> = ({
	isAuthorized,
	name,
	isOnline,
	hasNewMessage,
	blinkedLoginAnimation,
	setHasNewMessage,
	...rest
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
			<div className={s.root} {...rest}>
				<div className={s.title}>
					<h1>PIXEL BATTLE</h1>
					<h2>Пиксель батл 2023 S1E2</h2>
				</div>
				<div className={s.controls}>
					{isAuthorized ? (
						<>
							<div className={s.userName}>
								{name}
							</div>
							<a href="/logout" className={cn({ [s.disabled]: !isOnline })} aria-label="Выход">
								<LogoutIcon />
							</a>
						</>
					) : (
						<a href="/login" className={cn({ [s.disabled]: !isOnline, [s.blinked]: blinkedLoginAnimation })} aria-label="Авторизация">
							<LoginIcon />
						</a>
					)}
					<span className={cn(s.iconWrapper, { [s.badge]: hasNewMessage && !chatIsShowed })}>
						<ChatIcon className={s.iconButton} onClick={toggleChat} aria-label="Чат" />
					</span>
					<InfoIcon className={s.iconButton} onClick={toggleInfo} aria-label="Статистика" />
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
		</>
	);
};
