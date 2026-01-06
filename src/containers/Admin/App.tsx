import React, { useRef, useState, useEffect } from 'react';

import {
	Canvas,
	EMode,
	Palette,
	Tools,
} from '../../components';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import { APIhost } from '../../lib/api';

import ee from '../../lib/ee';

import { colorSchemes } from '../../../server/constants/colorSchemes';

import * as s from './App.module.scss';

export const App: React.FC = () => {
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');
	const [canvasMode, setCanvasMode] = useState<EMode>('CLICK' as EMode);
	const [coord, setCoord] = useState({});
	const [range, setRange] = useState({});
	const [size, setSize] = useState({ width: 0, height: 0 });
	// const [isFinished, setIsFinished] = useState(false); TODO

	const isMobile = useMobileLayout();

	const layer = useRef(null);

	const palette = (colorSchemes as any)[wsStore.canvas && wsStore.canvas.colorScheme] || {};

	useEffect(() => {
		if (!color && palette) {
			const firstColor = 'black' in palette
				? 'black'
				: (Object.keys(palette) || []).pop();
			setColor(firstColor as string);
		}
	}, [color, wsStore]);

	const handleCanvasClick = (x: number, y: number) => {
		setCoord({ x, y });
	};

	const handleSelect = (from: { x: number; y: number }, to: { x: number; y: number }) => {
		setRange({ from, to });
	};

	const onInitCanvas = ({ image }: any) => {
		setSize({
			width: image.width,
			height: image.height,
		});
	};

	useEffect(() => {
		ee.on('ws:init', (payload: any) => {
			setWsStore((store = {}) => ({ ...store, ...payload }));
		});
		ee.on('ws:expand', (payload: any) => {
			setWsStore((store = {}) => ({ ...store, canvas: payload }));
		});
	}, []);

	return (
		<div className={isMobile ? 'mobile' : ''}>
			<a href="/" className={s.backButton}>←</a>
			<Canvas
				mode={canvasMode}
				expand={wsStore.canvas}
				className={s.canvas}
				color={(wsStore.canvas && wsStore.canvas.colorScheme === 'truecolor') ? color : palette[color]}
				isOnline={true}
				onClick={handleCanvasClick}
				onSelect={handleSelect}
				onInit={onInitCanvas}
				src={`${APIhost}/canvas.png`}
			>
				<canvas className={s.layer} width={size.width} height={size.height} ref={layer}></canvas>
			</Canvas>
			{(wsStore && palette) && (
				<Palette
					color={color}
					colorScheme={wsStore.canvas && wsStore.canvas.colorScheme}
					setColor={setColor}
					onPick={() => {}}
				/>
			)}
			<Tools
				canvas={layer.current}
				expand={wsStore.canvas}
				coord={coord}
				range={range}
				color={(wsStore.canvas && wsStore.canvas.colorScheme === 'truecolor') ? color : palette[color]}
				setCanvasMode={setCanvasMode}
			/>
		</div>
	);
};
