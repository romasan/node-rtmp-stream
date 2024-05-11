import React, { FC } from 'react';

import { Block } from '../Block';
import { useModal } from '../../../../hooks';
import { Calendar } from './componets';

export const Metrics: FC = () => {
	const modalCalendar = useModal({
		content: (
			<Calendar />
		),
		width: 'calc(100% - 100px)',
		height: 'calc(100% - 100px)',
		portal: true,
	});
	return (
		<Block title="Метрики">
			<button onClick={modalCalendar.toggle}>календарь</button>
			<button>графики</button>
			<>{modalCalendar.render()}</>
		</Block>
	);
};
