import React, { useRef, useState, useEffect } from 'react';

import mobile from 'is-mobile';

import {
	Canvas,
	EMode,
	Palette,
	Tools,
} from '../../components';

import { APIhost } from '../../lib/api';

import ee from '../../lib/ee';

import * as s from './App.module.scss';

const disableMouse = {
	onMouseDown: (e: MouseEvent) => e.stopPropagation(),
	onMouseUp: (e: MouseEvent) => e.stopPropagation(),
};

export const App: React.FC = () => {
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');
	const [canvasMode, setCanvasMode] = useState<EMode>('CLICK' as EMode);
	const [coord, setCoord] = useState({});
	const [range, setRange] = useState({});
	const [size, setSize] = useState({ width: 0, height: 0 });
	// const [isFinished, setIsFinished] = useState(false); TODO

	const isMobile = mobile();

	const layer = useRef(null);

	useEffect(() => {
		if (!color && wsStore.palette) {
			const firstColor = 'black' in wsStore.palette
				? 'black'
				: (Object.keys(wsStore.palette) || []).pop();
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
	}, []);

	return (
		<div className={isMobile ? 'mobile' : ''}>
			<a href="/" className={s.backButton}>←</a>
			<Canvas
				mode={canvasMode}
				className={s.canvas}
				color={wsStore.palette ? wsStore.palette[color] : ''}
				isOnline={true}
				onClick={handleCanvasClick}
				onSelect={handleSelect}
				onInit={onInitCanvas}
				src={`${APIhost}/canvas.png`}
			>
				<canvas className={s.layer} width={size.width} height={size.height} ref={layer}></canvas>
			</Canvas>
			{(wsStore && wsStore.palette) && (
				<Palette
					color={color}
					colors={wsStore.palette}
					setColor={setColor}
				/>
			)}
			<Tools
				canvas={layer.current}
				coord={coord}
				range={range}
				color={color}
				setCanvasMode={setCanvasMode}
				{...disableMouse}
			/>
		</div>
	);
};
