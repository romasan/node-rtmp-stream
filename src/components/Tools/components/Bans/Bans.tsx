import React, { FC, useState } from 'react';

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

	return (
		<Block title="🔨 Управление банами" onOpen={handleOpen}>
			<div onClick={() => toggleOpened('token')} className={s.toggleButton}>token ({stats.token && Object.keys(stats.token).length}):</div>
			{opened === 'token' && (
				<>
					<div className={s.list}>
						{stats.token && Object.entries(stats.token).filter(([, v]) => v).map(([v]) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnbanByToken(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={token} onChange={({target: {value}}) => setToken(value)} placeholder="TOKEN" />
						<button onClick={handleClickBanByToken}>добавить</button>
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
			<div onClick={() => toggleOpened('ip')} className={s.toggleButton}>ip ({stats.ip && Object.keys(stats.ip).length}):</div>
			{opened === 'ip' && (
				<>
					<div className={s.list}>
						{stats.ip && Object.entries(stats.ip).filter(([, v]) => v).map(([v]) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnbanByIp(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={ip} onChange={({ target: { value }}) => setIp(value)} placeholder="IP ADDRESS" />
						<button onClick={handleClickBanByIp}>добавить</button>
						<button onClick={ipsModal.open}>списком</button>
					</div>
				</>
			)}
			<div onClick={() => toggleOpened('nick')} className={s.toggleButton}>nick ({stats.nick && Object.keys(stats.nick).length}):</div>
			{opened === 'nick' && (
				<>
					<div className={s.list}>
						{stats.nick && Object.entries(stats.nick).filter(([, v]) => v).map(([v]) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnbanByNick(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={nick} onChange={({ target: { value }}) => setNick(value)} placeholder="NICKNAME" />
						<button onClick={handleClickBanByNick}>добавить</button>
					</div>
				</>
			)}
			<div onClick={() => toggleOpened('mute')} className={s.toggleButton}>muted ({stats.mute && Object.keys(stats.mute).length}):</div>
			{opened === 'mute' && (
				<>
					<div className={s.list}>
						{stats.mute && Object.entries(stats.mute).filter(([, v]) => v).map(([v]) => (
							<div key={v} className={s.item}>
								{v}
								<span onClick={() => handleClickUnmuteByNick(v)}>&times;</span>
							</div>
						))}
					</div>
					<div>
						<input value={mute} onChange={({ target: { value }}) => setMute(value)} placeholder="MUTE BY NICKNAME" />
						<button onClick={handleClickMuteByNick}>замьютить</button>
					</div>
				</>
			)}
			{ipsModal.render()}
		</Block>
	);
};
