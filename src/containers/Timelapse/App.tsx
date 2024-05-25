import React, { useRef, useMemo, useState, useEffect } from 'react';

import cn from 'classnames';
import mobile from 'is-mobile';

import {
	Canvas,
	Header,
	Login,
} from '../../components';

import {
	fetchTimelapse,
	fetchTimelapsePartBin,
	APIhost,
} from '../../lib/api';

import { gzipAB, formatNumber } from '../../helpers';
import { useWsStore } from '../../hooks/useWsStore';

import { ITimelapse } from './types';

import { useModal } from '../../hooks';

import PlayIcon from '../../../assets/play.svg';
import PauseIcon from '../../../assets/pause.svg';
import FasterIcon from '../../../assets/faster.svg';
import SlowerIcon from '../../../assets/slower.svg';

import * as s from './App.module.scss';

const speedDegree = 1.1;
const defaultSpeed = 15_000;

const getTimelapseIndexes = (timelapse: any, cursor: number) => {
	const expandIndex = timelapse.expands
		.filter((expand: any) => expand.index.from <= cursor)
		.length - 1;
	const expand = timelapse.expands[expandIndex];
	const partIndex = Math.floor((cursor - expand.index.from + 1) / timelapse.partSize);
	const globalPartIndex = timelapse.expands
		.slice(0, expandIndex)
		.reduce(
			(sum: number, expand: any) => (sum + (expand.part.to - expand.part.from + 1)),
			0,
		) + partIndex;

	return {
		expandIndex,
		partIndex,
		globalPartIndex,
		expand,
	};
};

const fetchAndUnzipPart = async (episode: string, index: number) => {
	const list: number[][] = [];

	try {
		const resp = await fetchTimelapsePartBin(episode, index);
		const buf = await resp.arrayBuffer();
		const binary_8 = await gzipAB(buf);

		const binary_16 = new Uint16Array(binary_8.buffer);
		let item: number[] = [];

		binary_16.forEach((value) => {
			item.push(value);

			if (item.length === 3) {
				list.push(item);
				item = [];
			}
		});
	} catch (e) {
		console.log('Error:', e);
	}

	return list;
};

const expandCanvas = (canvas: any, w: number, h: number) => {
	const ctx = canvas.getContext('2d');
	const backup = document.createElement('canvas');
	const backupCTX: any = backup.getContext('2d');

	backup.width = canvas.width;
	backup.height = canvas.height;
	backupCTX.drawImage(canvas, 0, 0);
	canvas.width = w;
	canvas.height = h;
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, w, h);
	ctx.drawImage(backup, 0, 0);
};

export const App: React.FC = () => {
	const [selectedEpisode, setSelectedEpisode] = useState('s2e1');
	const [timelapse, setTimelapse] = useState<ITimelapse>({});
	const [speed, setSpeed] = useState(defaultSpeed);
	const speedRef = useRef(speed);
	const canvas = useRef(null);
	const canvasCTX = useRef({ fillRect: () => null });
	const playState = useRef(false);
	const [isPlayed, setIsPlayed] = useState(false);
	const timer = useRef(0);
	const playCursor = useRef(0);
	const [startPart, setStartPart] = useState(0);
	const parts = useRef<boolean[] | number[][][]>([]);
	const timelapseRef = useRef(null);
	const cursorRef = useRef(null);
	const countRef = useRef(0);
	const cursorExpand = useRef(-1);
	const centeringRef = useRef(() => {});
	const resetRef = useRef(() => {});
	const [loadedPart, setLoadedPart] = useState(-1);
	const [clickedCursor, setClickedCursor] = useState(-1);
	const [cursorDisplay, setCursorDisplay] = useState('');

	const imageSrc = useMemo(() => {
		return `${APIhost}/timelapse/${selectedEpisode}/${startPart}.png`;
	}, [selectedEpisode, startPart]);

	const frameWidth = useMemo(() => {
		const { width } = timelapseRef.current ? timelapseRef.current.getBoundingClientRect() : {};

		return (width - 3) / timelapse.total;
	}, [timelapse]);

	const {
		wsStore,
		isAuthorized,
		isOnline,
		hasNewMessage,
		setHasNewMessage,
	} = useWsStore();

	const isMobile = mobile();

	const loginModal = useModal({
		content: (
			<Login />
		),
		width: '300px',
	});

	const onInitCanvas = ({ image, centering, resetImage }: any) => {
		canvas.current = image;
		canvasCTX.current = image && image.getContext && image.getContext('2d');
		centeringRef.current = centering;
		resetRef.current = resetImage;
	};

	const fetchSelectedEpisodeTimelapse = async () => {
		try {
			const data = await fetchTimelapse(selectedEpisode);

			setTimelapse(data);
		} catch (e) {}
	};

	const preloadPart = async (partIndex: number) => {
		if (!parts.current[partIndex]) {
			parts.current[partIndex] = true;
			parts.current[partIndex] = await fetchAndUnzipPart(selectedEpisode, partIndex);
			setLoadedPart(partIndex);
		}
	};

	const moveTimelapseCursor = () => {
		if (cursorRef.current) {
			cursorRef.current.style.width = `${playCursor.current * frameWidth}px`;
		}
	};

	const play = () => {
		timer.current = Date.now();
		playState.current = true;
		setIsPlayed(true);
		frame();
	};

	const stop = () => {
		playState.current = false;
		setIsPlayed(false);
	};

	const frame = () => {
		if (!playState.current || !timelapse.expands) {
			return;
		}

		const frameTime = Date.now() - timer.current;
		
		if (frameTime) {
			let pixelToFrame = Math.floor(speedRef.current / 1000 * frameTime);

			moveTimelapseCursor();

			const {
				expandIndex,
				partIndex,
				globalPartIndex,
				expand,
			} = getTimelapseIndexes(timelapse, playCursor.current);

			const partFromIndex = expand.index.from + (partIndex * timelapse.partSize);
			const partToIndex = Math.min(expand.index.to - 1, partFromIndex + timelapse.partSize - 1);

			const prevExpand = timelapse.expands[expandIndex - 1];
			const cursorInPart = ((prevExpand && prevExpand.index.to) || 0) + partIndex * timelapse.partSize;

			if (globalPartIndex <= timelapse.totalParts - 1 && !parts.current[globalPartIndex + 1]) {
				void preloadPart(globalPartIndex + 1);
			}

			const pixelsToEndOfPart = partToIndex - playCursor.current;

			if (pixelsToEndOfPart < pixelToFrame) {
				pixelToFrame = pixelsToEndOfPart;
			}

			if (cursorExpand.current !== expandIndex) {
				cursorExpand.current = expandIndex;

				if (expandIndex) {
					expandCanvas(canvas.current, expand.canvas.width, expand.canvas.height);
					centeringRef.current();
				}
			}

			for (let i = 0; i < pixelToFrame; i++) {
				const partCursor = playCursor.current - cursorInPart + i;

				try {
					if (partCursor >= 0) {
						const [colorIndex, x, y] = parts.current[globalPartIndex][partCursor];
	
						canvasCTX.current.fillStyle = timelapse.colors[colorIndex];
						canvasCTX.current.fillRect(x, y, 1, 1);
	
						countRef.current = countRef.current + 1;
					}
				} catch (error) {
					console.log('Error:', error, partCursor);
				}
			}

			playCursor.current = playCursor.current + (pixelToFrame <= 0 ? 1 : pixelToFrame);
		}

		timer.current = Date.now();

		if (playCursor.current >= timelapse.total - 1) {
			stop();
			// playCursor.current = 0;
			// moveTimelapseCursor();

			return;
		}

		requestAnimationFrame(frame);
	};

	const renderTimelapseSteps = () => {
		if (!timelapseRef.current && !timelapse.total) {
			return null;
		}

		const { width } = timelapseRef.current.getBoundingClientRect();
		const pixel = width / timelapse.total;

		return (
			<>
				<div
					key="progress"
					ref={cursorRef}
					className={s.progress}
				/>
				{timelapse.expands && timelapse.expands.slice(1).map((expand) => (
					<>
						<div
							key={`${expand.index.from}-${expand.index.to}`}
							className={cn(s.position, s.positionExpand)}
							style={{ left: `${Math.floor(expand.index.from * pixel)}px` }}
						/>
					</>
				))}
			</>
		);
	};

	const drawPixelsFromPartStart = () => {
		if (!timelapse.expands || playState.current) {
			return;
		}

		const {
			partIndex,
			globalPartIndex,
			expand,
		} = getTimelapseIndexes(timelapse, playCursor.current);

		const pixelsCount = playCursor.current - (expand.index.from + partIndex * timelapse.partSize);
		resetRef.current();

		for (let i = 0; i < pixelsCount; i++) {
			try {
				const [colorIndex, x, y] = parts.current[globalPartIndex][i];

				canvasCTX.current.fillStyle = timelapse.colors[colorIndex];
				canvasCTX.current.fillRect(x, y, 1, 1);
			} catch (e) {
				console.log('Error:', e);

				return;
			}
		}
	};

	const handleToggleClick = () => {
		if (playState.current) {
			stop();
		} else {
			play();
		}
	};

	const handleClickTimelapse = (event: React.MouseEvent) => {
		if (!timelapse.expands) {
			return;
		}

		const { width, left } = timelapseRef.current ? timelapseRef.current.getBoundingClientRect() : {};
		const cursor = Math.floor((event.clientX - left) / width * timelapse.total);
		const { globalPartIndex } = getTimelapseIndexes(timelapse, cursor);

		stop();
		playCursor.current = cursor;
		setClickedCursor(cursor);
		moveTimelapseCursor();
		setStartPart(globalPartIndex);
		void preloadPart(globalPartIndex);
	};

	const handleFasterClick = () => {
		setSpeed((speed) => Math.floor(speed * speedDegree));
	};

	const handleSlowerClick = () => {
		setSpeed((speed) => Math.floor(speed / speedDegree));
	};

	const handleSelectEpisode = (event: any) => {
		setSelectedEpisode(event.target.value);
	};

	useEffect(() => {
		if (
			timelapse &&
			timelapse.episode === selectedEpisode &&
			parts.current[startPart] &&
			parts.current[startPart].length
		) {
			drawPixelsFromPartStart();
		}
	}, [startPart, selectedEpisode, timelapse, loadedPart, clickedCursor]);

	useEffect(() => {
		if (selectedEpisode) {
			stop();
			playCursor.current = 0;
			parts.current = [];
			setStartPart(0);
			void preloadPart(0);
			void fetchSelectedEpisodeTimelapse();
			moveTimelapseCursor();
		}
	}, [selectedEpisode]);

	useEffect(() => {
		speedRef.current = speed;
	}, [speed]);

	useEffect(() => {
		const callback = (event: KeyboardEvent) => {
			if (event.keyCode === 32) {
				handleToggleClick();
			}
		};

		document.body.addEventListener('keyup', callback);

		return () => {
			document.body.removeEventListener('keyup', callback);
		};
	}, [timelapse]);

	useEffect(() => {
		const timer = setInterval(() => {
			setCursorDisplay(`${formatNumber(playCursor.current ? playCursor.current + 1 : 0)} / ${timelapse ? formatNumber(timelapse.total) : 0}`);
		}, 300);

		return () => {
			clearInterval(timer);
		};
	}, [timelapse]);

	return (
		<>
			<div className={cn(s.root, { mobile: isMobile })}>
				<Header
					isAuthorized={isAuthorized}
					name={wsStore ? wsStore.name : ''}
					isOnline={isOnline}
					hasNewMessage={hasNewMessage}
					setHasNewMessage={setHasNewMessage}
					login={loginModal.open}
				/>
				<Canvas
					color={''}
					isOnline={isOnline}
					onInit={onInitCanvas}
					viewOnly
					src={imageSrc}
				/>

				<div className={s.bar}>
					<div className={s.timelapse} ref={timelapseRef} onClick={handleClickTimelapse}>
						{renderTimelapseSteps()}
					</div>

					<div className={s.controls}>
						<div className={s.leftControls}>
							<button className={s.button} onClick={handleToggleClick}>{isPlayed ? <PauseIcon /> : <PlayIcon />}</button>

							<div className={s.vDelimiter}></div>

							<button className={s.button} onClick={handleSlowerClick}><SlowerIcon /></button>
							<button className={s.button} onClick={handleFasterClick}><FasterIcon /></button>
							{Number((speed / defaultSpeed).toFixed(2))}X

							<div className={s.vDelimiter}></div>

							{cursorDisplay} pix
						</div>
						<div>
							Сезон:
							<select onChange={handleSelectEpisode}>
								<option value="s1e1">S1E1</option>
								<option value="s1e2">S1E2</option>
								<hr />
								<option value="s2e1" selected>S2E1</option>
							</select>
						</div>
					</div>
				</div>

			</div>
			{loginModal.render()}
		</>
	);
};
