import React, { useState, useEffect } from 'react';

import mobile from 'is-mobile';

import { Canvas, EMode } from '../../components/Canvas';
import { Palette } from '../../components/Palette';

// import { addPix } from './lib/api';
import ee from '../../lib/ee';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');

	const isMobile = mobile();

	useEffect(() => {
		if (!color && wsStore?.environment?.palette) {
			const firstColor = 'black' in wsStore?.environment?.palette ? 'black' : (Object.keys(wsStore?.environment?.palette) || []).pop();
			setColor(firstColor as string);
		}
	}, [color, wsStore]);

	const handleCanvasClick = (x: number, y: number) => {
		// addPix({ x, y, color });
		console.log('====', { x, y, color });
	}

	useEffect(() => {
		ee.on('ws:environment', (payload: any) => {
			setWsStore((store = {}) => ({ ...store, environment: payload }));
		});
	}, []);

	return (
		<div className={isMobile ? 'mobile' : ''}>
			<Canvas mode={EMode.SELECT} className={s.canvas} color={wsStore?.environment?.palette[color]} onClick={handleCanvasClick}>
				<div className={s.layout}>FOO</div>
			</Canvas>
			{wsStore?.environment?.palette && (
				<Palette color={color} colors={wsStore?.environment?.palette} setColor={setColor} />
			)}
		</div>
	)
}
