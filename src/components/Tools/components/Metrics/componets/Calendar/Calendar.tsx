import React, { FC, useState, useMemo, useEffect } from 'react';

import { StatefulToolTip } from 'react-portal-tooltip-upgraded';

import { get } from '../../../../helpers';

import {
	getMonthsRange,
	getMonthCalendar,
	prepareHours,
} from './helpers';

import * as s from './Calendar.module.scss';

export const getChart = (data: number[][], width: number, height: number) => {
	const max = data.reduce((current, [key, value]) => Math.max(current, value), 0);
	const path = `M0 ${height}L${data.map(([_, value], index) => {
		const y =  height - value / max * height;
		const x =  width / data.length * index;

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
	)
}

export const Calendar: FC = () => {
	const [history, setHistory] = useState({});

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
							}
						}

						return {
							day,
							totalPixels: 0,
							uniqSessions: 0,
						}
					}

					return null;
				})),
		}));
	}, [history]);

	return (
		<div>
			<div>Calendar</div>
			<div className={s.scrollable}>
				<div className={s.year}>
					{tree.map((month) => (
						<div className={s.month} key={month.title}>
							<div>{month.title}</div>
							<div>
								{month.weeks.map((week, weekIndex) => (
									<div className={s.week} key={`week-${month.title}-${weekIndex}`}>
										{week.map((day, dayIndex) => (
											<div className={s.day} key={`${month.title}-${dayIndex}`}>
												{day ? (
													<>
														<StatefulToolTip parent={(
															<>
																<div>{day.day}</div>
																<div>{day.uniqSessions || <>&nbsp;</>}</div>
																<div>{day.totalPixels || <>&nbsp;</>}</div>
															</>
														)}>
															<div className={s.tooltip}>
																<div className={s.hours}>
																	{prepareHours(day.pixByHours)
																		.map(([key, value]) => (
																			<div key={key}>{key}-00: {value}</div>
																		))
																	}
																</div>
																<div>
																	{getChart(prepareHours(day.pixByHours), 300, 100)}
																</div>
															</div>
														</StatefulToolTip>
													</>
												) : null}
											</div>
										))}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
