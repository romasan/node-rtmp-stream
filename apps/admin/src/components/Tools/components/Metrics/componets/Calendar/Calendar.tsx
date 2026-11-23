import React, { FC, useState, useMemo, useEffect, useRef } from 'react';
import cn from 'classnames';
import { get } from '../../../../helpers';
import { getMonthsRange, getMonthCalendar, prepareHours, getChartPoints } from './helpers';
import * as s from './Calendar.module.scss';

interface Day {
	totalPixels?: number;
	uniqSessions?: number;
	pixByHours?: Record<string, number>;
}
interface History {
	firstDay?: string;
	lastDay?: string;
	days?: Record<string, Day>;
}
const number = new Intl.NumberFormat('ru-RU');
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export const getChart = (data: [string, number][], width: number, height: number, label = 'Пиксели по часам') => (
	<svg viewBox={`-52 -12 ${width + 84} ${height + 42}`} role="img" aria-label={label} className={s.plot}>
		{[0, .5, 1].map((ratio) => (
			<g key={ratio}>
				<line x1="0" x2={width} y1={height * ratio} y2={height * ratio} className={s.gridLine} />
				<text x="-10" y={height * ratio + 4} textAnchor="end">{number.format(Math.round(Math.max(0, ...data.map(([, value]) => value)) * (1 - ratio)))}</text>
			</g>
		))}
		{[0, 6, 12, 18, 23].map((hour) => <text key={hour} x={hour / 23 * width} y={height + 24} textAnchor="middle">{String(hour).padStart(2, '0')}:00</text>)}
		<polyline points={getChartPoints(data, width, height)} className={s.line} />
	</svg>
);

export const Calendar: FC = () => {
	const detailsRef = useRef<HTMLElement>(null);
	const selectDay = (date: string) => {
		setSelected(date);
		const details = detailsRef.current;
		if (details && (details.parentElement?.clientWidth || 0) <= 660) {
			details.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};
	const [history, setHistory] = useState<History>({});
	const [selected, setSelected] = useState('');
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let active = true;
		setStatus('loading');
		get('history').then((data: History) => {
			if (!active) return;
			setHistory(data);
			setSelected(data.lastDay || '');
			setStatus('ready');
		}).catch(() => { if (active) setStatus('error'); });
		return () => { active = false; };
	}, [reload]);

	const months = useMemo(() => history.firstDay && history.lastDay
		? getMonthsRange(history.firstDay.split('-').map(Number), history.lastDay.split('-').map(Number))
		: [], [history]);
	const day = history.days?.[selected] || {};
	const hours = prepareHours(day.pixByHours);
	const peak = hours.reduce((best, item) => item[1] > best[1] ? item : best, hours[0]);

	return (
		<div className={s.root}>
			{status === 'loading' ? <div className={s.empty} role="status">Загрузка истории…</div>
				: status === 'error' ? <div className={s.empty} role="alert">Не удалось загрузить историю.<button onClick={() => setReload(value => value + 1)}>Повторить</button></div>
					: !months.length ? <div className={s.empty}>История пока пуста. Здесь появится активность по дням.</div>
						: <div className={s.layout}>
							<div className={s.calendarPane}>
								<div className={s.legend}>В ячейке: сессии / пиксели</div>
								<div className={s.months}>
									{months.map(month => (
										<section className={s.month} key={month} aria-label={monthLabel(month)}>
											<h3>{monthLabel(month)}</h3>
											<div className={s.weekdays}>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(name => <span key={name}>{name}</span>)}</div>
											<div className={s.days}>
												{getMonthCalendar(...month.split('-').map(Number) as [number, number]).flat().map((date, index) => {
													if (!date) return <span key={`empty-${index}`} />;
													const key = `${month}-${String(date).padStart(2, '0')}`;
													const stats = history.days?.[key] || {};
													return <button type="button" key={key} className={cn(s.day, { [s.selectedDay]: selected === key, [s.active]: Boolean(stats.totalPixels) })}
														onClick={() => selectDay(key)} aria-pressed={selected === key} aria-label={dateLabel(key)}
														title={`${dateLabel(key)}: ${number.format(stats.uniqSessions || 0)} сессий, ${number.format(stats.totalPixels || 0)} пикселей`}>
														<strong>{date}</strong><span>{number.format(stats.uniqSessions || 0)}</span><span>{number.format(stats.totalPixels || 0)}</span>
													</button>;
												})}
											</div>
										</section>
									))}
								</div>
							</div>
							<section ref={detailsRef} className={s.details} aria-label="Статистика выбранного дня">
								<h3>{selected ? dateLabel(selected) : 'Выберите день'}</h3>
								<div className={s.totals}>
									<div><span>Пиксели</span><strong>{number.format(day.totalPixels || 0)}</strong></div>
									<div><span>Сессии</span><strong>{number.format(day.uniqSessions || 0)}</strong></div>
								</div>
								<div className={s.chartTitle}>Пиксели по часам <span>{peak[1] ? `Пик в ${peak[0]}:00` : 'Нет активности'}</span></div>
								{getChart(hours, 460, 180)}
								<div className={s.hours}>
									{hours.map(([hour, value]) => <div key={hour}><span>{hour}:00</span><strong>{number.format(value)}</strong></div>)}
								</div>
							</section>
						</div>}
		</div>
	);
};
