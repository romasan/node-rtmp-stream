import { FC, useState } from 'preact/compat';

import { Block } from '../Block';

import { get, put, patch } from '../../helpers';

import * as s from './Bans.module.scss';

export const Bans: FC = () => {
	const [stats, setStats] = useState<any>({});
	const [ip, setIp] = useState('');
	const [token, setToken] = useState('');
	const [nick, setNick] = useState('');

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

	return (
		<Block title="Управление банами" onOpen={handleOpen}>
			<div>token ({stats.token && Object.keys(stats.token).length}):</div>
			<div className={s.list}>
				{stats.token && Object.entries(stats.token).filter(([, v]) => v).map(([v]) => (
					<div key={v} className={s.item}>
						{v}
						<span onClick={() => handleClickUnbanByToken(v)}>&times;</span>
					</div>
				))}
			</div>
			<div>
				<input value={token} onChange={({target: {value}}) => setToken(value)}/>
				<button onClick={handleClickBanByToken}>добавить</button>
				<select>
					<option value="0">навсегда TODO</option>
					<option value="0">1 час</option>
					<option value="0">сутки</option>
					<option value="0">неделя</option>
					<option value="0">месяц</option>
				</select>
			</div>
			<div>ip ({stats.ip && Object.keys(stats.ip).length}):</div>
			<div className={s.list}>
				{stats.ip && Object.entries(stats.ip).filter(([, v]) => v).map(([v]) => (
					<div key={v} className={s.item}>
						{v}
						<span onClick={() => handleClickUnbanByIp(v)}>&times;</span>
					</div>
				))}
			</div>
			<div>
				<input value={ip} onChange={({ target: { value }}) => setIp(value)}/>
				<button onClick={handleClickBanByIp}>добавить</button>
			</div>
			<div>nick ({stats.nick && Object.keys(stats.nick).length}):</div>
			<div className={s.list}>
				{stats.nick && Object.entries(stats.nick).filter(([, v]) => v).map(([v]) => (
					<div key={v} className={s.item}>
						{v}
						<span onClick={() => handleClickUnbanByNick(v)}>&times;</span>
					</div>
				))}
			</div>
			<div>
				<input value={nick} onChange={({ target: { value }}) => setNick(value)}/>
				<button onClick={handleClickBanByNick}>добавить</button>
			</div>
		</Block>
	);
};
