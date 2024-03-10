import { FC } from 'preact/compat';

import { Block } from '../Block';
import { useModal } from '../../../../hooks';

import * as s from './Metrics.module.scss';

export const Metrics: FC = () => {
	const modalCalendar = useModal({
		content: (
			<div className={s.root}>
				<div>FOO</div>
			</div>
		),
		width: 'calc(100% - 40px)',
		height: 'calc(100% - 40px)',
		portal: true,
	});
	return (
		<Block title="Метрики">
			<button onClick={modalCalendar.open}>календарь</button>
			<button>графики</button>
		</Block>
	);
};
