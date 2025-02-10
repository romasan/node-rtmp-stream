import React, { FC, useState, useEffect } from 'react';

import { Block } from '../Block';

import { get, patch } from '../../helpers';

import * as s from './Countdown.module.scss';

export const Countdown: FC = () => {
	const [ranges, setRanges] = useState<any>({});
	const [changed, setChanged] = useState(true);

	useEffect(() => {
		if (changed && ranges.authorized && ranges.guest) {
			setChanged(false);
			setRanges((_ranges) => ({
				authorized: _ranges.authorized.sort(([a], [b]) =>  a - b).filter(([a,, c]) => a || c),
				guest: _ranges.guest.sort(([a], [b]) =>  a - b).filter(([a,, c]) => a || c),
			}));
		}
	}, [ranges, changed]);

	// console.log('==== ranges', ranges);

	const handleOpen = () => {
		get('countdown')
			.then(setRanges)
			.catch(() => {/* */});
	};

	const onChangeKey = (key: string, index: number, value: string) => {
		setRanges((ranges) => ({
			...ranges,
			[key]: ranges[key].map((item, i) => index === i ? [value, '', item[2]] : item),
		}));
	};

	const onChangeValue = (key, index, value) => {
		setRanges((ranges) => ({
			...ranges,
			[key]: ranges[key].map((item, i) => index === i ? [item[0], '', value] : item),
		}));
	};

	const addRange = (key) => {
		setRanges((ranges) => ({
			...ranges,
			[key]: [
				...ranges[key],
				['', '', ''],
			]
		}));
	};

	const deleteRange = (key, index) => {
		setRanges((ranges) => ({
			...ranges,
			[key]: ranges[key].filter((range, i) => i !== index),
		}));
	};

	const prepareRange = (range) => {
		return range
			.sort(([a], [b]) => a - b)
			.map(([a,, c], index) => {
				if (index === range.length - 1) {
					return [Number(a), null, Number(c)];
				} else {
					return [Number(a), range[index + 1][0] - 1, Number(c)];
				}
			});
	};

	const save = () => {
		const newRanges = {
			authorized: prepareRange(ranges.authorized),
			guest: prepareRange(ranges.guest),
		};

		patch('countdown', JSON.stringify(newRanges))
			.then(handleOpen)
			.catch(() => {/* */});
	};

	return (
		<Block title="⏲️ Управление КД" onOpen={handleOpen}>
			<div>
				<div>Авторизованные</div>
				<div className={s.row}>
					<div>online</div>
					<div>sec.</div>
				</div>
				{ranges && ranges.authorized && ranges.authorized.map(([key,, value], index) => (
					<div className={s.row} key={`authorized-${index}`}>
						<input value={key} onChange={({ target }) => onChangeKey('authorized', index, target.value)} onBlur={() => setChanged(true)} />
						<input value={value} onChange={({ target }) => onChangeValue('authorized', index, target.value)} />
						<button onClick={() => deleteRange('authorized', index)}>&times;</button>
					</div>
				))}
				<button className={s.addButton} onClick={() => addRange('authorized')}>+</button>
			</div>
			<div>
				<div>Гости</div>
				<div className={s.row}>
					<div>count</div>
					<div>sec.</div>
				</div>
				{ranges && ranges.guest && ranges.guest.map(([key,, value], index) => (
					<div className={s.row} key={`guest-${index}`}>
						<input value={key} onChange={({ target }) => onChangeKey('guest', index, target.value)} onBlur={() => setChanged(true)} />
						<input value={value} onChange={({ target }) => onChangeValue('guest', index, target.value)} />
						<button onClick={() => deleteRange('guest', index)}>&times;</button>
					</div>
				))}
				<button className={s.addButton} onClick={() => addRange('guest')}>+</button>
			</div>
			<button onClick={save}>save</button>
		</Block>
	);
};
