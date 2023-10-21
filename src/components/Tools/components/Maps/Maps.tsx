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
			{/* <div>
				<button>последние</button>
				<select>
					<option>100</option>
					<option>1 000</option>
					<option>10 000</option>
					<option>100 000</option>
				</select>
			</div> */}
		</Block>
	);
}
