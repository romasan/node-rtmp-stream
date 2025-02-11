import React, { FC, useState, useEffect } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

import { getStats } from '../../lib/api';

import { formatNumber } from '../../helpers/formatNumber';
import { nickSanitize } from '../../helpers/nickSanitize';

import TwitchIcon from '/assets/twitch_bw.svg';
import DiscordIcon from '/assets/discord_bw.svg';
import SteamIcon from '/assets/steam_bw.svg';
import TelegramIcon from '/assets/telegram_bw.svg';
import VkIcon from '/assets/vk_bw.svg';

import * as s from './Info.module.scss';

interface Props {
	onClose: Function;
}

const icons = {
	twitch: TwitchIcon,
	discord: DiscordIcon,
	steam: SteamIcon,
	telegram: TelegramIcon,
	vk: VkIcon,
};

export const Info: FC<Props> = ({
	onClose,
	...props
}) => {
	const [stats, setStats] = useState({
		loading: true,
		leaderboard: [],
		total: 0,
		onlineList: [],
		onlineCount: 0,
	});
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 350, y: 55});

	useEffect(() => {
		getStats()
			.then(setStats)
			.catch(() => {/* */});
	}, []);

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}>
				<button className={s.close} onClick={onClose}>&times;</button>
			</div>
			<div className={s.content} {...props}>
				{(stats && stats.loading) ? (
					<div>Загрузка...</div>
				) : (
					<div>
						<div>Всего поставлено пикселей: {formatNumber(stats.total)}</div>
						<div>
							<div className={s.title}>ТОП участников:</div>
							{(stats.leaderboard || []).map((item) => (
								<div key={String(item.place)} className={s.leaderBoardItem}>
									<span>
										{item.place < 10 && <>&nbsp;</>}
										{item.place}.
										{icons[item.platform] ? icons[item.platform]() : <div className={s.space} />}
										{nickSanitize(item.name)}
									</span>
									<span>
										{formatNumber(item.count)}
									</span>
								</div>
							))}
						</div>
						{stats.onlineCount > 0 && (
							<div>
								<div className={s.title}>Онлайн ({stats.onlineCount}): </div>
								{stats.onlineList.map((item) => (
									<div key={String(item.place)} className={s.leaderBoardItem}>
										<span>
											&nbsp;&nbsp;&nbsp;
											{icons[item.area] ? icons[item.area]() : <div className={s.space} />}
											{item.name}
										</span>
									</div>
								))}
								{((stats.onlineList.length - stats.onlineCount) > 0) && (
									<div>
										&nbsp;&nbsp;&nbsp;и ещё {(stats.onlineList.length - stats.onlineCount)} игрока
									</div>
								)}
							</div>
						)}
						{/* <div>
							<div>Squad-ы: </div>
							<div>&nbsp;</div>
							{(stats.leaderboard || []).map((item) => (
								<div key={String(item.place)} className={s.leaderBoardItem}>
									<span>
										{item.place < 10 && <>&nbsp;</>}
										{item.place}.
										{icons[item.platform] ? icons[item.platform]() : <div className={s.space} />}
										{item.name}
									</span>
									<span>
										{formatNumber(item.count)}
									</span>
								</div>
							))}
							<div>
								<button>Войти в squad</button>
							</div>
						</div> */}
					</div>
				)}
			</div>
		</div>
	);
};
