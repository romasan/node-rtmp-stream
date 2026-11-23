import React, { FC, FormEvent, useRef, useState } from 'react';
import cn from 'classnames';

import { Block } from '../Block';
import { addBan, BAN_TYPES, BanList, BanType, loadBans, removeBan } from './api';
import * as s from './Bans.module.scss';

const categories: Record<BanType, { title: string; label: string; placeholder: string; empty: string }> = {
	token: { title: 'Сессии', label: 'Токен сессии', placeholder: 'UUID или токен', empty: 'Заблокированных сессий пока нет.' },
	ip: { title: 'IP', label: 'IP-адрес', placeholder: '192.0.2.1 или 2001:db8::1', empty: 'Заблокированных IP пока нет.' },
	nick: { title: 'Ники', label: 'Никнейм', placeholder: 'Никнейм пользователя', empty: 'Банов по никнейму пока нет.' },
	mute: { title: 'Мьюты', label: 'Никнейм', placeholder: 'Никнейм пользователя', empty: 'Мьютов в чате пока нет.' },
};
const emptyFields = (): Record<BanType, string> => ({ token: '', ip: '', nick: '', mute: '' });
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
const termLabel = (type: BanType, term: true | number) => {
	// IP and mute expiration is not enforced by the current backend.
	if (term === true || type === 'ip' || type === 'mute') return 'Бессрочно';
	if (term <= Date.now()) return 'Срок истёк';
	return `До ${new Date(term).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
};

export const Bans: FC = () => {
	const [stats, setStats] = useState<BanList | null>(null);
	const [tab, setTab] = useState<BanType>('token');
	const [queries, setQueries] = useState(emptyFields);
	const [drafts, setDrafts] = useState(emptyFields);
	const [adding, setAdding] = useState(false);
	const [bulkIp, setBulkIp] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState('');
	const [pending, setPending] = useState<{ kind: 'add' } | { kind: 'remove'; value: string } | null>(null);
	const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
	const [copied, setCopied] = useState('');
	const initialTabChosen = useRef(false);
	const loadVersion = useRef(0);
	const saving = useRef(false);

	const refresh = async () => {
		const version = ++loadVersion.current;
		setLoading(true);
		setLoadError('');
		try {
			const bans = await loadBans();
			if (version !== loadVersion.current) return;
			setStats(bans);
			if (!initialTabChosen.current) {
				setTab(BAN_TYPES.find(type => Object.keys(bans[type]).length > 0) || 'token');
				initialTabChosen.current = true;
			}
		} catch (error) {
			if (version === loadVersion.current) setLoadError(errorMessage(error));
		} finally {
			if (version === loadVersion.current) setLoading(false);
		}
	};

	const list = stats?.[tab] || {};
	const entries = Object.keys(list).sort((a, b) => a.localeCompare(b));
	const query = queries[tab].trim().toLocaleLowerCase();
	const filtered = entries.filter(value => value.toLocaleLowerCase().includes(query));
	const draft = drafts[tab];
	const values = tab === 'ip'
		? Array.from(new Set(draft.split(/\r?\n|,\s*/).map(value => value.trim()).filter(Boolean)))
		: [draft.trim()].filter(Boolean);
	const newValues = values.filter(value => !Object.prototype.hasOwnProperty.call(list, value));
	const busy = loading || Boolean(pending);
	const canAdd = Boolean(stats && !loadError && newValues.length && !busy);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!canAdd || saving.current) return;
		saving.current = true;
		setPending({ kind: 'add' });
		setFeedback(null);
		try {
			await addBan(tab, newValues.join('\n'));
			setDrafts(previous => ({ ...previous, [tab]: '' }));
			setAdding(false);
			setFeedback({ kind: 'success', text: tab === 'mute' ? 'Мьют добавлен.' : newValues.length > 1 ? 'IP-адреса заблокированы.' : 'Бан добавлен.' });
			await refresh();
		} catch (error) {
			setFeedback({ kind: 'error', text: errorMessage(error) });
		} finally {
			saving.current = false;
			setPending(null);
		}
	};

	const remove = async (value: string) => {
		if (busy || saving.current || loadError) return;
		saving.current = true;
		setPending({ kind: 'remove', value });
		setFeedback(null);
		try {
			await removeBan(tab, value);
			setFeedback({ kind: 'success', text: tab === 'mute' ? `Мьют для «${value}» снят.` : `Бан для «${value}» снят.` });
			await refresh();
		} catch (error) {
			setFeedback({ kind: 'error', text: errorMessage(error) });
		} finally {
			saving.current = false;
			setPending(null);
		}
	};

	const copy = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(value);
		} catch {
			setFeedback({ kind: 'error', text: 'Не удалось скопировать. Полное значение доступно при наведении на строку.' });
		}
	};

	return (
		<Block id="bans" title="🔨 Управление банами" onOpen={refresh}>
			<div className={s.root}>
				<div className={s.tabs} role="group" aria-label="Тип блокировки">
					{BAN_TYPES.map(type => (
						<button type="button" key={type} aria-pressed={tab === type} disabled={busy || !stats}
							className={cn(s.tab, { [s.activeTab]: tab === type })}
							onClick={() => { setTab(type); setAdding(false); setFeedback(null); setCopied(''); }}>
							{categories[type].title}<span>{stats ? Object.keys(stats[type]).length : '—'}</span>
						</button>
					))}
				</div>

				<div className={s.toolbar}>
					<button type="button" className={s.addButton} onClick={() => { setAdding(value => !value); setFeedback(null); }}
						disabled={busy || !stats || Boolean(loadError)} aria-expanded={adding} aria-controls="ban-add-form">
						{tab === 'mute' ? '+ Добавить мьют' : '+ Добавить бан'}
					</button>
					<button type="button" onClick={() => void refresh()} disabled={busy}>{loading ? 'Загрузка…' : 'Обновить'}</button>
				</div>

				{feedback && <div className={cn(s.feedback, { [s.error]: feedback.kind === 'error' })} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}
				{loadError && <div className={cn(s.feedback, s.error)} role="alert">{stats && 'Список не обновлён. '}{loadError}</div>}

				{adding && <form id="ban-add-form" className={s.form} onSubmit={submit}>
					<div className={s.formTitle}>{tab === 'mute' ? 'Новый мьют в чате' : 'Новый бан'}<span>Бессрочно</span></div>
					<label htmlFor="ban-value">{tab === 'ip' && bulkIp ? 'IP-адреса, каждый с новой строки' : categories[tab].label}</label>
					{tab === 'ip' && bulkIp
						? <textarea id="ban-value" rows={5} value={draft} disabled={busy} onChange={event => setDrafts(previous => ({ ...previous, [tab]: event.target.value }))} />
						: <input id="ban-value" autoComplete="off" spellCheck={false} placeholder={categories[tab].placeholder} value={draft} disabled={busy}
							onChange={event => setDrafts(previous => ({ ...previous, [tab]: event.target.value }))} />}
					{tab === 'ip' && <label className={s.bulkToggle}><input type="checkbox" checked={bulkIp} disabled={busy} onChange={event => {
						setBulkIp(event.target.checked);
						// A multi-line draft must stay visible until submitted or edited.
						if (!event.target.checked) setDrafts(previous => ({ ...previous, ip: previous.ip.replace(/\r?\n/g, ', ') }));
					}} />Несколько IP-адресов</label>}
					{values.length > 0 && !newValues.length && <div className={s.hint}>Уже есть в списке блокировок.</div>}
					<div className={s.formActions}>
						<button type="submit" className={s.addButton} disabled={!canAdd}>{pending?.kind === 'add' ? 'Сохранение…' : tab === 'mute' ? 'Замьютить' : 'Заблокировать'}</button>
						<button type="button" disabled={busy} onClick={() => setAdding(false)}>Отмена</button>
					</div>
				</form>}

				<label className={s.search}>
					<span>Поиск в списке</span>
					<input type="search" placeholder={tab === 'ip' ? 'Найти IP-адрес…' : tab === 'token' ? 'Найти сессию…' : 'Найти никнейм…'} value={queries[tab]}
						disabled={!stats} onChange={event => setQueries(previous => ({ ...previous, [tab]: event.target.value }))} />
				</label>
				<div className={s.listHeading}><span>{categories[tab].title}</span><span>{stats ? `${filtered.length} из ${entries.length}` : '—'}</span></div>
				<div className={s.list} aria-label={`Список: ${categories[tab].title}`} aria-busy={loading}>
					{!stats ? <div className={s.empty} role="status">{loading ? 'Загрузка списка…' : 'Список не загружен.'}</div>
						: !filtered.length ? <div className={s.empty}>{query ? 'Ничего не найдено. Измените поисковый запрос.' : categories[tab].empty}</div>
							: filtered.map(value => <div key={value} className={s.item}>
								<div className={s.details}>
									<span className={cn(s.value, { [s.token]: tab === 'token' || tab === 'ip' })} title={value}>{value}</span>
									<span className={s.term}>{termLabel(tab, list[value])}</span>
								</div>
								<button type="button" className={s.copy} onClick={() => void copy(value)} aria-label={`Копировать ${value}`} title={copied === value ? 'Скопировано' : 'Копировать'}>{copied === value ? '✓' : '⧉'}</button>
								<button type="button" className={s.remove} onClick={() => void remove(value)} disabled={busy || Boolean(loadError)} aria-label={`Снять ${tab === 'mute' ? 'мьют' : 'бан'}: ${value}`}>{pending?.kind === 'remove' && pending.value === value ? 'Снятие…' : 'Снять'}</button>
							</div>)}
				</div>
				{copied && <span className={s.copyStatus} role="status">Значение скопировано.</span>}
			</div>
		</Block>
	);
};
