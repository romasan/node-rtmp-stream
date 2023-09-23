import React, { useRef, useState, useEffect } from 'react';

import mobile from 'is-mobile';

import { Canvas, EMode, Palette, Tools } from '../../components';

// import { addPix } from './lib/api';
import ee from '../../lib/ee';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');

	const isMobile = mobile();

	const layer = useRef(null);

	useEffect(() => {
		if (!color && wsStore?.palette) {
			const firstColor = 'black' in wsStore?.palette ? 'black' : (Object.keys(wsStore?.palette) || []).pop();
			setColor(firstColor as string);
		}
	}, [color, wsStore]);

	const handleCanvasClick = (x: number, y: number) => {
		console.log('==== click', { x, y });
	};

	const handleSelect = (from: { x: number; y: number }, to: { x: number; y: number }) => {
		console.log('==== select', from, to);
	};

	useEffect(() => {
		ee.on('ws:init', (payload: any) => {
			setWsStore((store = {}) => ({ ...store, ...payload }));
		});
	}, []);

	return (
		<div className={isMobile ? 'mobile' : ''}>
			<Canvas
				mode={EMode.CLICK}
				className={s.canvas}
				color={wsStore?.palette?.[color]}
				onClick={handleCanvasClick}
				onSelect={handleSelect}
			>
				{/* <div className={s.layout}></div> */}
				<canvas className={s.layer} width="426px" height="240px" ref={layer}></canvas>
			</Canvas>
			{wsStore?.palette && (
				<Palette color={color} colors={wsStore?.palette} setColor={setColor} />
			)}
			<Tools />
		</div>
	)
}
