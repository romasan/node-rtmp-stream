import React, { FC, useState, useMemo, useEffect } from 'react';
import cn from 'classnames';

// import { LineChart } from 'react-chartkick';
// import 'chartkick/chart.js'

import { get } from '../../../../helpers';

import {
	getMonthsRange,
	getMonthCalendar,
	prepareHours,
} from './helpers';

import * as s from './Calendar.module.scss';

export const getChart = (data: number[][], width: number, height: number, label?: string) => {
	console.log('==== getChart', {
		data,
		width,
		height,
		label,
	});
	const max = data.reduce((current, [, value]) => Math.max(current, value), 0);
	const startY = height - data[0][1] / max * height;
	const path = `M0 ${startY}L${data.slice(1).map(([, value], index) => {
		const y =  height - value / max * height;
		const x =  width / data.length * (index + 1);

		return `${x} ${y}`;
	}).join(' ')}`;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			fill="currentColor"
		>
			<path d={path} stroke="#000" fill="none" />
		</svg>
	);
};

export const Calendar: FC = () => {
	const [history, setHistory] = useState({});
	const [selected, setSelected] = useState(null);

	useEffect(() => {
		get('history')
			.then(setHistory)
			.catch(() => {/* */});
	}, []);

	const tree = useMemo(() => {
		if (!history.firstDay) {
			return [];
		}

		return getMonthsRange(
			history.firstDay.split('-').map(Number),
			history.lastDay.split('-').map(Number),
		).map((item) => ({
			title: item,
			weeks: getMonthCalendar(...(item.split('-').map(Number)))
				.map((week) => week.map((day) => {
					if (day) {
						const key = `${item}-${String(day).padStart(2, '0')}`;

						if (history.days[key]) {
							return {
								day,
								...history.days[key],
							};
						}

						return {
							day,
							totalPixels: 0,
							uniqSessions: 0,
						};
					}

					return null;
				})),
		}));
	}, [history]);

	return (
		<div>
			<div>Календарь</div>
			<div className={s.scrollable}>
				{tree.map((month) => (
					<div className={s.month} key={month.title}>
						<div>{month.title}</div>
						<div>
							{month.weeks.map((week, weekIndex) => (
								<div className={s.week} key={`week-${month.title}-${weekIndex}`}>
									{week.map((day, dayIndex) => (
										day ? (
											<div
												key={`${month.title}-${dayIndex}`}
												className={cn(s.day, {
													[s.selectedDay]: selected && selected.day.day === day.day && selected.month.title === month.title,
													[s.active]: Boolean(day.totalPixels),
												})}
												onClick={() => setSelected({
													day,
													month,
													weekIndex,
												})}
											>
												<div>{day.day}</div>
												<div>{day.uniqSessions || <>&nbsp;</>}</div>
												<div>{day.totalPixels || <>&nbsp;</>}</div>
											</div>
										) : (
											<div className={s.day} key={`${month.title}-${dayIndex}`}>&nbsp;</div>
										)
									))}
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{Boolean(selected) && (
				<div className={s.chart}>
					<div className={s.hours}>
						{prepareHours(selected.day.pixByHours)
							.map(([key, value]) => (
								<div key={key}>{key}-00: {value}</div>
							))
						}
					</div>
					<div className={s.chart}>
						{getChart(prepareHours(selected.day.pixByHours), 300, 100, `${selected.month.title}-${selected.weekIndex}-${selected.day.day}`)}
						{/* <LineChart data={{"2025-05-13": 2, "2025-05-14": 5}} /> */}
					</div>
				</div>
			)}
		</div>
	);
};
