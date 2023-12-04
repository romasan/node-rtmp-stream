import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';
import mobile from 'is-mobile';

import {
	Canvas,
	EMode,
} from '../../components';

import {
	fetchTimelapse,
	fetchTimelapsePartBin,
} from '../../lib/api';

import * as s from './App.module.scss';

const gzipAB = async (input: ArrayBuffer, compress = false) => {
	const cs = compress ? new CompressionStream("gzip") : new DecompressionStream("gzip");
	const writer = cs.writable.getWriter();
	const reader = cs.readable.getReader();
	const output = [];
	let totalSize = 0;

	writer.write(input);
	writer.close();

	for (let item; (item = await reader.read()) && !item.done;) {
		output.push(item.value);
		totalSize += item.value.byteLength;
	}

	const concatenated = new Uint8Array(totalSize);
	let offset = 0;

	for (const array of output) {
		concatenated.set(array, offset);
		offset += array.byteLength;
	}

	return concatenated;
};

export const App: React.FC = () => {
	const [wsStore, setWsStore] = useState<any>({});
	const [color, setColor] = useState('');
	const [canvasMode, setCanvasMode] = useState<EMode>('CLICK' as EMode);
	const [season, setSeason] = useState('s1e1');
	const [size, setSize] = useState({ width: 0, height: 0 });
	const [timelapse, setTimelapse] = useState({});
	const [cursor, setCursor] = useState({
		expand: 0,
		block: 0,
		pixel: 0,
	});

	console.log('==== timelapse:', timelapse);

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
		// setCoord({ x, y });
	};

	const handleSelect = (from: { x: number; y: number }, to: { x: number; y: number }) => {
		// setRange({ from, to });
	};

	const onInitCanvas = ({ image }: any) => {
		setSize({
			width: image.width,
			height: image.height,
		});
	};

	const fetchSeason = async (season: string) => {
		const data = await fetchTimelapse(season);

		setTimelapse(data);

		const resp = await fetchTimelapsePartBin(season, 0);

		const buf = await resp.arrayBuffer();

		const binary_8 = await gzipAB(buf);
		const binary_16 = new Uint16Array(binary_8.buffer);
		const list: number[][] = [];
		let item: number[] = [];

		binary_16.forEach((value) => {
			item.push(value);
			if (item.length === 3) {
				list.push(item);
				item = [];
			}
		});

		console.log('==== bin:', buf.byteLength, list);
	};

	useEffect(() => {
		if (season) {
			fetchSeason(season);
		}
	}, [season]);

	return (
		<div className={cn(s.root, { mobile: isMobile })}>
			<Canvas
				// mode={canvasMode}
				className={s.canvas}
				color={wsStore.palette ? wsStore.palette[color] : ''}
				isOnline={true}
				onClick={handleCanvasClick}
				onSelect={handleSelect}
				onInit={onInitCanvas}
			>
				<canvas className={s.layer} width={size.width} height={size.height} ref={layer}></canvas>
			</Canvas>

			<div className={s.controls}>
				<select>
					<option>S1E1</option>
				</select>
				<button>⏵ / ⏸</button>
				<button>-</button>
				<button>+</button>
			</div>

			<div className={s.timelapse}></div>
		</div>
	);
};
