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

	const getMap = (name: string) => {
		const ctx = canvas.getContext('2d');

		const image = new Image();
		image.src = `${APIhost}/qq/${name}`;
		image.onload = () => {
			ctx.drawImage(image, 0, 0);
		};
	};

	const getHeatmap = () => {
		getMap('heatmap.png');
	};

	const getByUsersMap = () => {
		getMap('usersmap.png');
	};

	const getNewestMap = () => {
		getMap('newestmap.png');
	};

	const getLastPixels = () => {
		getMap(`lastPixels.png?count=${lastPixelsValue}`);
	};

	const handleSelect = (event: any) => {
		setLastPixelsValue(Number(event.target.value));
	};

	useEffect(() => {
		if (canvas) {
			canvas.width = canvas.width;
		}
	}, [canvas, opened]);

	return (
		<Block title="Карты" onToggle={setOpened}>
			<div>
				<button onClick={getHeatmap}>heatmap</button>
			</div>
			<div>
				<button onClick={getByUsersMap}>по юзеру</button>
			</div>
			<div>
				<button onClick={getNewestMap}>по давности</button>
			</div>
			<div>
				<button onClick={getLastPixels}>последние</button>
				<select onChange={handleSelect}>
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
			</div>
			<div>// TODO</div>
			<div>
				<button>за последний</button>
				<select>
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
				</select>
			</div>
			<div>
				<button>by session</button>
				<input placeholder="UUID"/>
			</div>
		</Block>
	);
};
