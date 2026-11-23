import React, { FC, FormEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { Block } from '../Block';
import { ToolsContext } from '../../context';
import { CanvasGeometry, CanvasPoint, getMarkerPosition } from '../../../Canvas/marker';
import { findSessions, loadGeometry, loadOnline, loadStats, OverviewStats } from './api';
import { filterSessions, formatDuration, getCoverage, groupSessions, OnlineConnection } from './model';
import * as s from './Stats.module.scss';

interface Props {
	userInfo: (userId: string, filter?: string, event?: any) => void;
	onHighlightPixel?: (point: CanvasPoint | null) => void;
}
const number = new Intl.NumberFormat('ru-RU');
const percentage = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const count = (value: number | null | undefined) => value == null ? '—' : number.format(value);
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Не удалось обновить данные.';
const ageLabel = (value: number | null) => value === null ? 'Нет данных об активности' : value < 1000 ? 'Только что' : `${formatDuration(value)} назад`;

export const Stats: FC<Props> = ({ userInfo, onHighlightPixel }) => {
	const { opened } = useContext(ToolsContext);
	const active = opened === 'stats';
	const activeRef = useRef(active);
	activeRef.current = active;
	const [stats, setStats] = useState<OverviewStats | null>(null);
	const [geometry, setGeometry] = useState<CanvasGeometry | null>(null);
	const [updatedAt, setUpdatedAt] = useState<number | null>(null);
	const [now, setNow] = useState(Date.now());
	const [loading, setLoading] = useState(false);
	const [statsError, setStatsError] = useState('');
	const [geometryError, setGeometryError] = useState('');
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [onlineOpen, setOnlineOpen] = useState(false);
	const onlineOpenRef = useRef(false);
	const [online, setOnline] = useState<OnlineConnection[] | null>(null);
	const [onlineLoading, setOnlineLoading] = useState(false);
	const [onlineError, setOnlineError] = useState('');
	const [onlineUpdatedAt, setOnlineUpdatedAt] = useState<number | null>(null);
	const [query, setQuery] = useState('');
	const [activeOnly, setActiveOnly] = useState(false);
	const [highlighted, setHighlighted] = useState<CanvasPoint | null>(null);
	const [copyNotice, setCopyNotice] = useState('');
	const [copyError, setCopyError] = useState('');
	const [nick, setNick] = useState('');
	const [found, setFound] = useState<{ query: string; uuids: string[] } | null>(null);
	const [lookupLoading, setLookupLoading] = useState(false);
	const [lookupError, setLookupError] = useState('');
	const overviewRequest = useRef<AbortController | null>(null);
	const onlineRequest = useRef<AbortController | null>(null);
	const lookupRequest = useRef<AbortController | null>(null);

	const refreshOverview = useCallback(async () => {
		if (!activeRef.current || overviewRequest.current) return;
		const controller = new AbortController();
		overviewRequest.current = controller;
		setLoading(true);
		const [summary, size] = await Promise.allSettled([loadStats(controller.signal), loadGeometry(controller.signal)]);
		if (!controller.signal.aborted && activeRef.current) {
			if (summary.status === 'fulfilled') {
				setStats(summary.value); setUpdatedAt(Date.now()); setNow(Date.now()); setStatsError('');
			} else setStatsError(errorMessage(summary.reason));
			if (size.status === 'fulfilled') { setGeometry(size.value); setGeometryError(''); }
			else setGeometryError(errorMessage(size.reason));
			setLoading(false);
		}
		if (overviewRequest.current === controller) overviewRequest.current = null;
	}, []);
	const refreshOnline = useCallback(async () => {
		if (!activeRef.current || !onlineOpenRef.current || onlineRequest.current) return;
		const controller = new AbortController();
		onlineRequest.current = controller;
		setOnlineLoading(true);
		try {
			const rows = await loadOnline(controller.signal);
			if (!controller.signal.aborted && activeRef.current && onlineOpenRef.current) {
				setOnline(rows); setOnlineUpdatedAt(Date.now()); setNow(Date.now()); setOnlineError('');
			}
		} catch (error) {
			if (!controller.signal.aborted && activeRef.current && onlineOpenRef.current) setOnlineError(errorMessage(error));
		} finally {
			if (!controller.signal.aborted) setOnlineLoading(false);
			if (onlineRequest.current === controller) onlineRequest.current = null;
		}
	}, []);
	const refresh = useCallback(() => { void refreshOverview(); void refreshOnline(); }, [refreshOverview, refreshOnline]);

	useEffect(() => {
		if (active) { setNow(Date.now()); refresh(); }
		else { setLoading(false); setOnlineLoading(false); setLookupLoading(false); setHighlighted(null); setCopyNotice(''); setCopyError(''); }
		return () => {
			[overviewRequest, onlineRequest, lookupRequest].forEach(ref => { ref.current?.abort(); ref.current = null; });
		};
	}, [active, refresh]);
	useEffect(() => {
		if (!active) return;
		const clock = window.setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
		const poll = autoRefresh ? window.setInterval(() => { if (!document.hidden) refresh(); }, 10000) : null;
		const onVisible = () => { if (!document.hidden) { setNow(Date.now()); if (autoRefresh) refresh(); } };
		document.addEventListener('visibilitychange', onVisible);
		return () => { clearInterval(clock); if (poll !== null) clearInterval(poll); document.removeEventListener('visibilitychange', onVisible); };
	}, [active, autoRefresh, refresh]);
	useEffect(() => {
		if (!active) onHighlightPixel?.(null);
		return () => onHighlightPixel?.(null);
	}, [active, onHighlightPixel]);

	const toggleOnline = () => {
		const next = !onlineOpen;
		onlineOpenRef.current = next;
		setOnlineOpen(next);
		if (next) void refreshOnline();
		else { onlineRequest.current?.abort(); onlineRequest.current = null; setOnlineLoading(false); }
	};
	const copy = async (value: string) => {
		setCopyNotice(''); setCopyError('');
		try { await navigator.clipboard.writeText(value); setCopyNotice('Токен скопирован.'); }
		catch { setCopyError('Не удалось скопировать. Полный токен доступен при наведении на строку.'); }
	};
	const search = async (event: FormEvent) => {
		event.preventDefault();
		if (!nick.trim() || lookupRequest.current) return;
		const controller = new AbortController();
		lookupRequest.current = controller;
		setLookupLoading(true); setLookupError('');
		const requestedNick = nick;
		try {
			const uuids = await findSessions(requestedNick, controller.signal);
			if (!controller.signal.aborted) setFound({ query: requestedNick, uuids });
		} catch (error) { if (!controller.signal.aborted) setLookupError(errorMessage(error)); }
		finally { if (!controller.signal.aborted) setLookupLoading(false); if (lookupRequest.current === controller) lookupRequest.current = null; }
	};

	const elapsed = updatedAt === null ? 0 : Math.max(0, now - updatedAt);
	const last = stats?.lastPixel;
	const lastAge = last?.age == null ? null : last.age + elapsed;
	const coverage = stats && geometry && !geometryError && !statsError ? getCoverage(stats.empty, geometry) : null;
	const groups = groupSessions(online || []);
	const filtered = filterSessions(groups, query, activeOnly);
	const markerAvailable = Boolean(last && geometry && !geometryError && !statsError && getMarkerPosition(last, geometry) && onHighlightPixel);

	return <Block id="stats" title="📋 Обзор">
		<div className={s.root}>
			<div className={s.toolbar}><label><input type="checkbox" checked={autoRefresh} onChange={event => setAutoRefresh(event.target.checked)} />Автообновление · 10 с</label><button type="button" onClick={refresh} disabled={loading || onlineLoading}>{loading || onlineLoading ? 'Загрузка…' : 'Обновить'}</button></div>
			<div className={s.freshness}>{updatedAt === null ? 'Данные ещё не загружены' : `Сводка обновлена ${formatDuration(elapsed)} назад`}{statsError && ' · данные устарели'}</div>
			{statsError && <div className={s.error} role="alert">{statsError}</div>}
			<div className={s.metrics}>
				<div><span>Онлайн</span><strong>{count(stats?.online.unique)}</strong><small>уникальных сессий</small></div>
				<div><span>За минуту</span><strong>{count(stats?.perMin)}</strong><small>поставлено пикселей</small></div>
				<div><span>За час</span><strong>{count(stats?.perHour)}</strong><small>поставлено пикселей</small></div>
				<div><span>Всего поставлено</span><strong>{count(stats?.total)}</strong><small>включая повторную закраску</small></div>
			</div>
			<div className={s.connectionCounts}>Подключений: {count(stats?.online.open)} · активных: {count(stats?.online.active)}<span>Всего соединений: {count(stats?.online.all)}</span></div>
			<section className={s.section} aria-label="Последний пиксель">
				<h3>Последний пиксель</h3>
				{last ? <>
					<div className={s.lastAuthor}><button type="button" disabled={!last.uuid} onClick={event => last.uuid && userInfo(last.uuid, 'token', event)} title="Открыть сессию автора">{last.name || 'Автор не указан'}</button><span>{ageLabel(lastAge)}</span></div>
					<div className={s.pixelDetails}><span className={s.swatch} style={{ backgroundColor: last.color || 'transparent' }} aria-hidden="true" /><code>{last.color || 'Цвет не указан'}</code><span>[{last.x}, {last.y}]</span></div>
					<div className={s.actions}><button type="button" disabled={!markerAvailable} onClick={() => { const point = { x: last.x, y: last.y }; setHighlighted(point); onHighlightPixel?.(point); }}>Показать на полотне</button>{highlighted && <button type="button" onClick={() => { setHighlighted(null); onHighlightPixel?.(null); }}>Убрать маркер</button>}</div>
					{highlighted && <p className={s.hint}>Выделено: [{highlighted.x}, {highlighted.y}]</p>}
					<details className={s.details}><summary>Детали сессии</summary><div className={s.tokenLine}><code title={last.uuid || ''}>{last.uuid || 'Токен не указан'}</code>{last.uuid && <button type="button" onClick={() => void copy(last.uuid!)} aria-label="Копировать токен последнего автора">Копировать</button>}</div><p className={s.hint}>IP: {last.ip || 'не указан'}</p></details>
				</> : <p className={s.hint}>{loading && !stats ? 'Загрузка активности…' : 'Данных о последнем пикселе пока нет.'}</p>}
				{!last && highlighted && <div className={s.actions}><button type="button" onClick={() => { setHighlighted(null); onHighlightPixel?.(null); }}>Убрать маркер</button><span className={s.hint}>Выделено: [{highlighted.x}, {highlighted.y}]</span></div>}
			</section>
			<section className={s.section} aria-label="Заполнение полотна">
				<h3>Заполнение полотна</h3>
				{coverage ? <><div className={s.coverageHeading}><strong>{percentage.format(coverage.percent)}%</strong><span>{count(geometry?.width)} × {count(geometry?.height)} px</span></div><progress value={coverage.occupied} max={coverage.capacity} aria-label="Доля занятых клеток" /><div className={s.coverageCounts}><span>Занято: {count(coverage.occupied)}</span><span>Свободно: {count(coverage.free)}</span></div></> : <p className={s.hint}>{geometryError || (loading && !stats ? 'Загрузка размеров…' : 'Данные о заполнении недоступны.')}</p>}
			</section>
			<button type="button" className={s.onlineToggle} aria-expanded={onlineOpen} aria-controls="overview-online" onClick={toggleOnline}>{onlineOpen ? '▾' : '▸'} Кто онлайн{online ? ` · ${groups.length}` : ''}</button>
			{onlineOpen && <section id="overview-online" className={s.onlinePanel} aria-label="Сессии онлайн">
				<label className={s.searchLabel} htmlFor="overview-query">Поиск в списке<input id="overview-query" type="search" aria-label="Поиск сессии онлайн" placeholder="Ник или токен…" value={query} onChange={event => setQuery(event.target.value)} /></label>
				<div className={s.onlineFilters}><label><input type="checkbox" checked={activeOnly} onChange={event => setActiveOnly(event.target.checked)} />Только активные</label><button type="button" disabled={onlineLoading} onClick={() => void refreshOnline()}>{onlineLoading ? 'Загрузка…' : 'Обновить список'}</button></div>
				{onlineError && <div className={s.error} role="alert">{onlineError}</div>}
				<div className={s.freshness}>{onlineUpdatedAt === null ? 'Список ещё не загружен' : `${filtered.length} из ${groups.length} сессий · обновлено ${formatDuration(Math.max(0, now - onlineUpdatedAt))} назад`}</div>
				<div className={s.list} aria-busy={onlineLoading}>
					{!online ? <p className={s.empty}>{onlineLoading ? 'Загрузка сессий…' : 'Не удалось загрузить список.'}</p> : !filtered.length ? <p className={s.empty}>{query.trim() || activeOnly ? 'Нет сессий по выбранному фильтру.' : 'Подключённых сессий пока нет.'}</p>
						: filtered.map(session => <div key={session.key} className={s.session}>
							<div className={s.sessionHeader}><button type="button" disabled={!session.uuid} onClick={event => session.uuid && userInfo(session.uuid, 'token', event)} aria-label={`Открыть сессию ${session.name || 'без имени'}`}>{session.name || 'Без имени'}</button><span className={cn(s.activity, { [s.active]: session.active })}>{session.active ? 'Активна' : 'Неактивна'}</span></div>
							<div className={s.tokenLine}><code title={session.uuid || ''}>{session.uuid || 'Токен не указан'}</code>{session.uuid && <button type="button" onClick={() => void copy(session.uuid!)} aria-label={`Копировать токен ${session.name || 'сессии'}`}>Копировать</button>}</div>
							<div className={s.sessionMeta}><span>{ageLabel(session.lastActivity === null ? null : Math.max(0, now - session.lastActivity))}</span><span>{session.connections} подкл.</span></div>
						</div>)}
				</div>
			</section>}
			{copyNotice && <p className={s.hint} role="status">{copyNotice}</p>}{copyError && <div className={s.error} role="alert">{copyError}</div>}
			<details className={s.lookup}><summary>Найти сессии по нику</summary><form onSubmit={event => void search(event)}><label htmlFor="overview-nick">Точный никнейм<input id="overview-nick" aria-label="Никнейм для поиска сессий" value={nick} disabled={lookupLoading} onChange={event => { setNick(event.target.value); setFound(null); }} /></label><button type="submit" disabled={!nick.trim() || lookupLoading}>{lookupLoading ? 'Поиск…' : 'Найти'}</button></form>{lookupError && <div className={s.error} role="alert">{lookupError}</div>}{found && <div className={s.found}><p className={s.hint}>Сессии «{found.query}»: {found.uuids.length}</p>{found.uuids.map(uuid => <button type="button" key={uuid} title={uuid} onClick={event => userInfo(uuid, 'token', event)}>{uuid}</button>)}</div>}</details>
			<div className={s.uptime}>Сервер работает: {formatDuration(stats?.uptime == null ? null : stats.uptime + elapsed)}</div>
		</div>
	</Block>;
};
