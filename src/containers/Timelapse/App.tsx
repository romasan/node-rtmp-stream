import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';
import mobile from 'is-mobile';

import {
	Canvas,
	Header,
} from '../../components';

import {
	fetchTimelapse,
	fetchTimelapsePartBin,
	APIhost,
} from '../../lib/api';

import { gzipAB } from '../../helpers';
import { useWsStore } from '../../hooks/useWsStore';

import * as s from './App.module.scss';

const PART_PIXELS_COUNT = 100_000;

export const App: React.FC = () => {
	const [color, setColor] = useState('');
	const [selectedEpisode, setSelectedEpisode] = useState('s1e1');
	const [size, setSize] = useState({ width: 0, height: 0 });
	const [timelapse, setTimelapse] = useState<any>({});
	const [speed, setSpeed] = useState(500 * 30);
	const canvasCTX = useRef({ fillRect: () => null });
	const playState = useRef(false);
	const timer = useRef(0);
	const playCursor = useRef(0);
	const [cursor, setCursor] = useState(0);
	const parts = useRef<any>({});
	const timelapseRef = useRef(null);

	const {
		wsStore,
		isAuthorized,
		isOnline,
		hasNewMessage,
		setHasNewMessage,
	} = useWsStore();

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

	const onInitCanvas = ({ image }: any) => {
		setSize({
			width: image.width,
			height: image.height,
		});

		canvasCTX.current = image && image.getContext && image.getContext('2d');
	};

	const fetchPart = async (episode: string, index: number) => {
		const resp = await fetchTimelapsePartBin(episode, index);

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

		return list;
	}

	const fetchSelectedEpisode = async () => {
		try {
			const data = await fetchTimelapse(selectedEpisode);
			
			setTimelapse(data);
		} catch (e) {}
	};

	const handleSelectEpisode = (e) => {
		console.log('==== handleSelectEpisode', e);
	};

	const insert = async (partIndex: number) => {
		if (!parts.current[partIndex]) {
			parts.current[partIndex] = true;
			parts.current[partIndex] = await fetchPart(selectedEpisode, partIndex);
		}

		play();

		if (partIndex < timelapse.totalParts && !parts.current[partIndex + 1]) {
			parts.current[partIndex + 1] = true;
			parts.current[partIndex + 1] = await fetchPart(selectedEpisode, partIndex + 1);
		}
	};

	useEffect(() => {
		if (timelapse.total) {
			const expandIndex = timelapse.expands.findIndex((item: any) => item.index.from <= cursor && item.index.to >= cursor);
			const expand = timelapse.expands[expandIndex];
			const partIndex = expand.part.from + Math.floor((cursor - expand.index.from) / PART_PIXELS_COUNT);

			insert(partIndex);
		}
	}, [timelapse, cursor]);

	useEffect(() => {
		if (selectedEpisode) {
			fetchSelectedEpisode();
		}
	}, [selectedEpisode]);

	const play = () => {
		timer.current = Date.now();
		playState.current = true;
		frame();
	};

	const stop = () => {
		playState.current = false;
	};

	const frame = () => {
		if (!playState.current) {
			return;
		}

		const frameTime = Date.now() - timer.current;
		
		if (frameTime) {
			const pixelToFrame = Math.floor(speed / 1000 * frameTime);

			if ((playCursor.current + pixelToFrame) > PART_PIXELS_COUNT) {
				// debug
				return;
			}

			// const parts = []

			for (let i = 0; i < pixelToFrame; i++) {
				const [colorIndex, x, y] = parts.current[0][playCursor.current + i];

				canvasCTX.current.fillStyle = timelapse.colors[colorIndex];
				canvasCTX.current.fillRect(x, y, 1, 1);
			}
			playCursor.current = playCursor.current + pixelToFrame;
		}

		timer.current = Date.now();

		requestAnimationFrame(frame);
	}

	useEffect(() => {
		frame();
	});

	const renderSteps = () => {
		if (!timelapseRef.current && !timelapse.total) {
			return null;
		}

		const { width } = timelapseRef.current.getBoundingClientRect();
		
		const pixel = width / timelapse.total;

		return (
			<>
			{timelapse.expands && timelapse.expands.map((expand) => (
				<>
					{new Array(expand.part.to - expand.part.from + 1).fill(null).map((_, index) => (
						<div
							key={`${expand.index.from}-${expand.index.to}-${index}`}
							className={s.position}
							style={{ left: `${Math.floor((expand.index.from + index * PART_PIXELS_COUNT) * pixel)}px` }}
						/>
					))}
					<div
						key={`${expand.index.from}-${expand.index.to}`}
						className={s.position}
						style={{ background: 'red', height: '50%', left: `${Math.floor(expand.index.from * pixel)}px` }}
					/>
				</>
			))}
			</>
		);
	};

	return (
		<div className={cn(s.root, { mobile: isMobile })}>
			<Header
				isAuthorized={isAuthorized}
				name={wsStore ? wsStore.name : ''}
				isOnline={isOnline}
				hasNewMessage={hasNewMessage}
				setHasNewMessage={setHasNewMessage}
			/>
			<Canvas
				color={wsStore.palette ? wsStore.palette[color] : ''}
				isOnline={isOnline}
				onInit={onInitCanvas}
				viewOnly
				src={`${APIhost}/timelapse/s1e1/0.png`}
			/>

			<div className={s.controls}>
				<select onChange={handleSelectEpisode}>
					<option>S1E1</option>
				</select>
				<button>⏵ / ⏸</button>
				<button>-</button>
				<button>+</button>
				speed: {speed} pix per sec
			</div>

			<div className={s.timelapse} ref={timelapseRef}>
				{renderSteps()}
			</div>
		</div>
	);
};
