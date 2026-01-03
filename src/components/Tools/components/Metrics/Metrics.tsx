import React, { FC } from 'react';

import { Block } from '../Block';
import { useModal } from '/src/hooks';
import { Calendar } from './componets';

export const Metrics: FC = () => {
	const modalCalendar = useModal({
		content: (
			<Calendar />
		),
		portal: true,
	});
	return (
		<Block title="📊 Метрики">
			<button onClick={modalCalendar.toggle}>календарь</button>
			<button disabled>графики</button>
			<div>
				<a href="https://analytics.google.com/analytics/web/#/a347795738p480482307/reports/intelligenthome" target="_blank">
					<img width="16px" height="16px" src="https://ssl.gstatic.com/analytics/analytics-frontend.indexpage_20251210.14_p0/index/static/analytics_standard_icon.png" />
					Google Аналитика
				</a>
			</div>
			<div>
				<a href="https://metrika.yandex.ru/dashboard?id=95616481&period=week&group=day&isMinSamplingEnabled=false&currency=RUB&attr=%7B%22attributionId%22%3A%22LastSign%22%2C%22isCrossDevice%22%3Afalse%7D&isUndefinedEnabled=false&dashboardId=89334323-1188-4fab-821d-30ae24e32add" target="_blank">
					<svg width="16px" height="16px" viewBox="0 0 32 32"><mask id="mask0_1315_11716" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><ellipse cx="16" cy="16.0011" rx="16" ry="16" fill="white"></ellipse></mask><g mask="url(#mask0_1315_11716)"><rect y="0.00224304" width="32" height="32" fill="url(#paint0_linear_1315_11716)"></rect><path d="M0 20H10V32H0V20Z" fill="url(#paint1_linear_1315_11716)"></path><path d="M10 16.4C10 14.1598 10 13.0397 10.436 12.184C10.8195 11.4314 11.4314 10.8195 12.184 10.436C13.0397 10 14.1598 10 16.4 10H22V32H10V16.4Z" fill="url(#paint2_linear_1315_11716)"></path><path d="M22 0H32V32H22V0Z" fill="url(#paint3_linear_1315_11716)"></path></g><defs><linearGradient id="paint0_linear_1315_11716" x1="22.9334" y1="23.2008" x2="-3.46665" y2="-13.5992" gradientUnits="userSpaceOnUse"><stop stopColor="#4643B9"></stop><stop offset="1" stopColor="#1E8AFF"></stop></linearGradient><linearGradient id="paint1_linear_1315_11716" x1="10.6584" y1="27.8479" x2="-18.8276" y2="22.4987" gradientUnits="userSpaceOnUse"><stop stopColor="#FF002E"></stop><stop offset="1" stopColor="#FFADA1"></stop></linearGradient><linearGradient id="paint2_linear_1315_11716" x1="83.8" y1="80.2778" x2="91.207" y2="20.8038" gradientUnits="userSpaceOnUse"><stop stopColor="#3C3BA0"></stop><stop offset="0.489583" stopColor="#1E8AFF"></stop><stop offset="1" stopColor="#00B2FF"></stop></linearGradient><linearGradient id="paint3_linear_1315_11716" x1="22" y1="1.64523" x2="50.1153" y2="16.4011" gradientUnits="userSpaceOnUse"><stop stopColor="#FFEA1A"></stop><stop offset="1" stopColor="#FFB800"></stop></linearGradient></defs></svg>
					Яндекс Метрика
				</a>
			</div>
			{modalCalendar.render()}
		</Block>
	);
};
