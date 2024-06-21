import React from 'react';

import TwitchIcon from '/assets/twitch.svg';
import DiscordIcon from '/assets/discord.svg';

import * as s from './Login.module.scss';

export const Login = () => {
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
				{/*<a href="/login/?steam">*/}
				{/*	<SteamIcon />*/}
				{/*	Steam*/}
				{/*</a>*/}
			</div>
		</>
	);
};
