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
			{modalCalendar.render()}
		</Block>
	);
};
