import React, { useState, useEffect } from 'react';

import TwitchIcon from '/assets/twitch.svg';
import DiscordIcon from '/assets/discord.svg';
import TelegramIcon from '/assets/telegram.svg';

import * as s from './Login.module.scss';

export const Login = () => {
	const [hasTgLogin, setHasTgLogin] = useState(false);

	useEffect(() => {
		if (document.location.hash === '#debug-tg-login') {
			setHasTgLogin(true);
		}
	}, []);

	return (
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
				{hasTgLogin && (
					<a href="/login/?telegram">
						<TelegramIcon />
						Telegram
					</a>
				)}
				{/*<a href="/login/?steam">*/}
				{/*	<SteamIcon />*/}
				{/*	Steam*/}
				{/*</a>*/}
			</div>
		</>
	);
};
