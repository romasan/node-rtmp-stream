import React, { FC, useState } from 'react';
import cn from 'classnames';

import { useModal } from '/src/hooks';

import { Block } from '../Block';

import { get, put, patch } from '../../helpers';

import * as s from './Bans.module.scss';

export const Bans: FC = () => {
	const [stats, setStats] = useState<any>({});
	const [ip, setIp] = useState('');
	const [token, setToken] = useState('');
	const [nick, setNick] = useState('');
	const [mute, setMute] = useState('');
	const [ipsText, setIpsText] = useState('');
	const [opened, setOpened] = useState('');

	const toggleOpened = (value: string) => {
		setOpened(value === opened ? '' : value);
	};

	const handleOpen = () => {
		get('getBans')
			.then(setStats)
			.catch(() => {/* */});
	};

	const handleClickBanByIp = () => {
		put('ban', JSON.stringify({ type: 'ip', value: ip }), false)
			.then(() => handleOpen())
			.catch(() => {/* */})
			.finally(() => setIp(''));
	};

	const handleClickBanByToken = () => {
		put('ban', JSON.stringify({ type: 'token', value: token }), false)
			.then(() => handleOpen())
			.catch(() => {/* */})
			.finally(() => setToken(''));
	};

	const handleClickBanByNick = () => {
		put('ban', JSON.stringify({ type: 'nick', value: nick }), false)
			.then(() => handleOpen())
			.catch(() => {/* */})
			.finally(() => setNick(''));
	};

	const handleClickUnbanByIp = (value: string) => {
		patch('unban', JSON.stringify({ type: 'ip', value }), false)
			.then(() => handleOpen())
			.catch(() => {/* */});
	};

	const handleClickUnbanByToken = (value: string) => {
		patch('unban', JSON.stringify({ type: 'token', value }), false)
			.then(() => handleOpen())
			.catch(() => {/* */});
	};

	const handleClickUnbanByNick = (value: string) => {
		patch('unban', JSON.stringify({ type: 'nick', value }), false)
			.then(() => handleOpen())
			.catch(() => {/* */});
	};

	const handleClickUnmuteByNick = (value: string) => {
		patch('unban', JSON.stringify({ type: 'mute', value }), false)
			.then(() => handleOpen())
			.catch(() => {/* */});
	};

	const handleClickMuteByNick = () => {
		put('ban', JSON.stringify({ type: 'mute', value: mute }), false)
			.then(() => handleOpen())
			.catch(() => {/* */})
			.finally(() => setMute(''));
	};

	const addIps = () => {
		put('ban', JSON.stringify({ type: 'ip', value: ipsText }), false)
			.then(() => {
				handleOpen();
				ipsModal.close();
			})
			.catch(() => {/* */});
	};

	const ipsModal = useModal({
		content: (
			<div>
				<div>Add IPs</div>
				<div>
					<textarea rows={10} cols={60} onChange={({ target }) => setIpsText(target.value)}></textarea>
				</div>
				<div>
					<button disabled={!ipsText} onClick={addIps}>add</button>
				</div>
			</div>
		),
		portal: true,
	});

	const bannedByToken = stats.token ? Object.keys(stats.token).length : 0;
	const bannedByIp = stats.ip ? Object.keys(stats.ip).length : 0;
	const bannedByNickname = stats.nick ? Object.keys(stats.nick).length : 0;
	const mutedByNick = stats.mute ? Object.keys(stats.mute).length : 0;

	const filterList = (value: string) => {
		const query = { token, ip, nick, mute }[opened] || '';

		return !query || value.includes(query);
	};

	const bannedByTokenFiltered = stats.token ? Object.keys(stats.token).filter(filterList).length : 0;
	const bannedByIpFiltered = stats.ip ? Object.keys(stats.ip).filter(filterList).length : 0;
	const bannedByNicknameFiltered = stats.nick ? Object.keys(stats.nick).filter(filterList).length : 0;
	const mutedByNickFiltered = stats.mute ? Object.keys(stats.mute).filter(filterList).length : 0;

	return (
		<Block title="🔨 Управление банами" onOpen={handleOpen}>
			<div onClick={() => toggleOpened('token')} className={cn(s.toggleButton, { [s.active]: opened === 'token' })}>Бан для сессии ({bannedByToken})</div>
			<div onClick={() => toggleOpened('ip')} className={cn(s.toggleButton, { [s.active]: opened === 'ip' })}>Бан по IP ({bannedByIp})</div>
			<div onClick={() => toggleOpened('nick')} className={cn(s.toggleButton, { [s.active]: opened === 'nick' })}>Бан по нику ({bannedByNickname})</div>
			<div onClick={() => toggleOpened('mute')} className={cn(s.toggleButton, { [s.active]: opened === 'mute' })}>Мьют в чате (по нику) ({mutedByNick})</div>

			<hr />

			{opened === 'token' && (
				<>
					<div className={s.blockTitle}>Бан для сессии: {bannedByTokenFiltered}</div>
					<div className={s.list}>
						{stats.token && Object.keys(stats.token).filter(filterList).sort().map((v) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnbanByToken(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={token} onChange={({target: {value}}) => setToken(value)} placeholder="TOKEN" />
						<button onClick={handleClickBanByToken} disabled={!token}>добавить</button>
						<select>
							<option value="0">навсегда TODO</option>
							<option value="0">1 час</option>
							<option value="0">сутки</option>
							<option value="0">неделя</option>
							<option value="0">месяц</option>
						</select>
					</div>
				</>
			)}
			{opened === 'ip' && (
				<>
					<div className={s.blockTitle}>Бан по IP: {bannedByIpFiltered}</div>
					<div className={s.list}>
						{stats.ip && Object.keys(stats.ip).filter(filterList).sort().map((v) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnbanByIp(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={ip} onChange={({ target: { value }}) => setIp(value)} placeholder="IP ADDRESS" />
						<button onClick={handleClickBanByIp} disabled={!ip}>добавить</button>
						<button onClick={ipsModal.open}>списком</button>
					</div>
				</>
			)}
			{opened === 'nick' && (
				<>
					<div className={s.blockTitle}>Бан по нику: {bannedByNicknameFiltered}</div>
					<div className={s.list}>
						{stats.nick && Object.keys(stats.nick).filter(filterList).sort().map((v) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnbanByNick(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={nick} onChange={({ target: { value }}) => setNick(value)} placeholder="NICKNAME" />
						<button onClick={handleClickBanByNick} disabled={!nick}>добавить</button>
					</div>
				</>
			)}
			{opened === 'mute' && (
				<>
					<div className={s.blockTitle}>Мьют в чате: {mutedByNickFiltered}</div>
					<div className={s.list}>
						{stats.mute && Object.keys(stats.mute).filter(filterList).sort().map((v) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnmuteByNick(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={mute} onChange={({ target: { value }}) => setMute(value)} placeholder="MUTE BY NICKNAME" />
						<button onClick={handleClickMuteByNick} disabled={!mute}>замьютить</button>
					</div>
				</>
			)}
			<div>
				<div>
					IP с несколькими юзерами:&nbsp;
					<a href="#">TODO</a>
				</div>
			</div>
			{ipsModal.render()}
		</Block>
	);
};
