import React, { FC, useState, useEffect } from 'react';

import { Block } from '../Block';

import { APIhost } from '../../helpers';

// import * as s from './Maps.module.scss';

const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;

interface Props {
	canvas: any;
}

export const Maps: FC<Props> = ({
	canvas,
}) => {
	const [opened, setOpened] = useState(false);
	const [lastPixelsValue, setLastPixelsValue] = useState(100);
	const [timeValue, setTimeValue] = useState(min);
	const [ipValue, setIpValue] = useState('');
	const [uuidValue, setUUIDValue] = useState('');
	const [clearOnExit, setClearOnExit] = useState(true);

	const getMap = (name: string) => {
		const ctx = canvas.getContext('2d');

		const image = new Image();
		image.src = `${APIhost}/admin/${name}`;
		image.onload = () => {
			ctx.drawImage(image, 0, 0);
		};
	};

	const getHeatmap = () => {
		getMap('heatmap.png');
	};

	const getByUsersMap = () => {
		getMap(`usersmap.png?uuid=${uuidValue}`);
	};

	const getNewestMap = () => {
		getMap('newestmap.png');
	};

	const getLastPixels = () => {
		getMap(`lastPixels.png?count=${lastPixelsValue}`);
	};

	const getByIP = () => {
		getMap(`byIP.png?ip=${ipValue}`);
	};

	const getByTime = () => {
		getMap(`byTime.png?time=${timeValue}`);
	};

	const handleChangeLastPixels = (event: any) => {
		if (isNaN(Number(event.target.value))) {
			return;
		}

		setLastPixelsValue(Number(event.target.value));
	};

	const handleChangeTime = (event: any) => {
		setTimeValue(Number(event.target.value));
	};

	const handleChangeIP = (event: any) => {
		setIpValue(event.target.value);
	};

	const handleChangeUUID = (event: any) => {
		setUUIDValue(event.target.value);
	};

	useEffect(() => {
		if (canvas && clearOnExit) {
			canvas.width = canvas.width;
		}
	}, [canvas, opened, clearOnExit]);

	return (
		<Block title="🗺️ Карты активности" onToggle={setOpened}>
			<div>
				<label>
					<input
						type="checkbox"
						checked={clearOnExit}
						onChange={(e) => {
							setClearOnExit(e.target.checked);
						}}
					/>
					очищать при выходе из блока
				</label>
			</div>
			<div>
				<button onClick={getHeatmap}>heatmap</button>
			</div>
			<div>
				<button onClick={getByUsersMap}>по сессиям</button>
				<input placeholder="UUID" onChange={handleChangeUUID}/>
			</div>
			<div>
				<button onClick={getNewestMap}>по давности</button>
			</div>
			<div>
				<button onClick={getLastPixels}>последние</button>
				<select onChange={handleChangeLastPixels}>
					<option value="100">100</option>
					<option value="300">300</option>
					<option value="500">500</option>
					<option value="1000">1 000</option>
					<option value="2000">2 000</option>
					<option value="3000">3 000</option>
					<option value="5000">5 000</option>
					<option value="10000">10 000</option>
					<option value="30000">30 000</option>
					<option value="50000">50 000</option>
					<option value="100000">100 000</option>
				</select>
				<input size={10} value={lastPixelsValue} onChange={handleChangeLastPixels} />
			</div>
			<div>
				<button onClick={getByTime}>за последний</button>
				<select onChange={handleChangeTime}>
					<option value={min}>1 минута</option>
					<option value={5 * min}>5 минут</option>
					<option value={10 * min}>10 минут</option>
					<option value={15 * min}>15 минут</option>
					<option value={30 * min}>30 минут</option>
					<option value={hour}>час</option>
					<option value={2 * hour}>2 часа</option>
					<option value={3 * hour}>3 часа</option>
					<option value={5 * hour}>5 часов</option>
					<option value={10 * hour}>10 часов</option>
					<option value={day}>сутки</option>
					<option value={2 * day}>2 дня</option>
					<option value={3 * day}>3 дня</option>
					<option value={5 * day}>5 дней</option>
					<option value={7 * day}>неделя</option>
				</select>
				#{timeValue}#
			</div>
			<div>
				<button onClick={getByIP}>по IP</button>
				<input placeholder="IP" onChange={handleChangeIP}/>
			</div>
			<div>
				<button disabled>без учёта заблокированных</button>
			</div>
		</Block>
	);
};
