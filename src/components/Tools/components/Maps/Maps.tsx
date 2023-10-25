import React, { FC, useState, useEffect } from 'react';

import { Block } from '../Block';

import { APIhost } from '../../helpers';

// import * as s from './Maps.module.scss';

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

		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

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
		</Block>
	);
}
