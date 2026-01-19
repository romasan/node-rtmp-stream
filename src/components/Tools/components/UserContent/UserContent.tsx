import React, { useEffect, useState } from 'react';

import { get } from '../../helpers';
import { formatDate } from '../../../../helpers';

import * as s from './UserContent.module.scss';

interface IProps {
	filter?: string;
	query: string;
}

const simpleDate = (time: string) => formatDate(Number(time), 'DD.MMMM.YYYY hh:mm:ss');

export const UserContent = ({ filter, query }: IProps) => {
	const [user, setUser] = useState(null);
	const [session, setSession] = useState(null);
	const [opened, setOpened] = useState('');
	const toggle = (event: MouseEvent, key: string) => {
		event.preventDefault();
		setOpened((value: string) => value === key ? '' : key);
	}

	useEffect(() => {
		if (filter === 'token') {
			get(`user/token?query=${query}`)
				.then((data) => {
					setUser(data.user);
					setSession(data.session);
				})
				.catch(() => {/* */ });
		} else {
			get(`user/nick?query=${query}`)
				.then((data) => {
					setUser(data.user);
					setSession(data.session);
				})
				.catch(() => {/* */ });
		}
	}, [filter, query]);

	return (
		<div>
			<div>Поиск по {filter}: "{query}"</div>
			<hr />
			<div className={s.header}>Пользователь</div>
			{user ? (
				<>
					<div>Ник: {user.parsed && user.parsed.name}</div>
					<div>Авторизован через: {user.parsed && user.parsed.area}</div>
					<div>
						Сессии: <a href="#">99</a> TODO
					</div>
					<div>
						<button disabled>Бан по нику</button>
					</div>
					<div>
						<details>
							<summary>RAW</summary>
							<div>
								{user.raw && Object.entries(user.raw).map(([key, value]) => (
									<div key={key}>{key}: {value}</div>
								))}
							</div>
						</details>
					</div>
				</>
			) : (
				<div>не найден</div>
			)}
			<div className={s.header}>Сессия</div>
			{session ? (
				<>
					<div>Все входы: <a href="#" onClick={(event) => toggle(event, 'allSessions')}>{session && session.total}</a></div>
					{opened === 'allSessions' && session.table && (
						<div className={s.scrollable}>
							{session.table.map(([time, ip]) => (
								<div key={time}>{simpleDate(time)}; {ip}</div>
							))}
						</div>
					)}
					<div>Уникальные IP: <a href="#" onClick={(event) => toggle(event, 'ips')}>{session && session.IPs && session.IPs.length}</a></div>
					{opened === 'ips' && (
						<div className={s.scrollable}>
							{session.IPs.map((ip) => (
								<div key={ip}>{ip} (banned ?)</div>
							))}
						</div>
					)}
					<div>Первый логин: {session && simpleDate(session.firstLogin)}</div>
					<div>Последний логин: {session && simpleDate(session.lastLogin)}</div>
					<div>Последняя активность (пиксель): TODO -1,-1 #000000</div>
				</>
			) : (
				<div>нет такой сессии</div>
			)}
		</div>
	);
};
