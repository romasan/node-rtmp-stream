import React, { FC, useState, useMemo, useEffect } from 'react';

import { Block } from '../Block';

import {
	get,
	put,
	drop,
} from '../../helpers';

enum ECorner {
	LT = 'LT',
	RT = 'RT',
	RB = 'RB',
	LB = 'LB',
}

import { colorSchemes } from '../../../../../server/constants/colorSchemes';

// import * as s from './UpdateLevel.module.scss';

export const Expand: FC = () => {
	const [expand, setExpand] = useState<any>({});
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const [shiftX, setShiftX] = useState(0);
	const [shiftY, setShiftY] = useState(0);
	const [colorScheme, setcolorScheme] = useState('');
	const [corner, setCorner] = useState(ECorner.LT);
	const [paused, setPaused] = useState(false);

	// const onChangeFreeze = (event: any) => {
	// 	setCanvasConf((value: any) => ({ ...value, freezed: event.target.value === 'true' }));
	// 	patch('streamSettings', JSON.stringify({ ...canvasConf, freezed: event.target.value === 'true' }), 'TEXT');
	// };

	const saveExpand = async () => {
		await put('expand', JSON.stringify({
			width,
			height,
			shiftX,
			shiftY,
			colorScheme,
		}), 'TEXT');
		void onOpen();
	};

	const onOpen = () => {
		get('expand')
			.then((data) => {
				setExpand(data);
				setWidth(data.width);
				setHeight(data.height);
				setShiftX(data.shiftX);
				setShiftY(data.shiftY);
				setcolorScheme(data.colorScheme);
			})
			.catch(() => {/* */});

		get('pause')
			.then((data) => {
				setPaused(Boolean(data && data.paused));
			})
			.catch(() => {/* */});
	};

	const handleChangeWidth = (event) => setWidth(event.target.value);
	const handleChangeHeight = (event) => setHeight(event.target.value);

	const handleBlurWidth = () => {
		if (Number(width) < Number(expand.width)) {
			setWidth(expand.width);
		}
	};

	const handleBlurHeight = () => {
		if (Number(height) < Number(expand.height)) {
			setHeight(expand.height);
		}
	};

	const handleClickCorner = (event) => {
		setCorner(event.target.id);
	};

	const handleChangeLock = () => {
		if (paused) {
			drop('pause', null, 'TEXT')
				.catch(() => {/* */});
		} else {
			put('pause', null, 'TEXT')
				.catch(() => {/* */});
		}

		setPaused(!paused);
	};

	const handleSelectColorScheme = (event: any) => {
		setcolorScheme(event.target.value);
	};

	const isDisabledSaveButton = useMemo(
		() => width === expand.width &&
			height === expand.height &&
			expand.colorScheme === colorScheme,
		[width, height, colorScheme, expand],
	);

	useEffect(() => {
		setShiftX(
			(corner === ECorner.RT || corner === ECorner.RB)
				? expand.shiftX + (width - expand.width)
				: expand.shiftX
		);
		
		setShiftY(
			(corner === ECorner.LB || corner === ECorner.RB)
				? expand.shiftY + (height - expand.height)
				: expand.shiftY
		);
	}, [corner, width, height, expand]);

	return (
		<Block title="🖼️ Полотно и палитра" onOpen={onOpen}>
			<div>
				<label>
					<input type="checkbox" checked={paused} onChange={handleChangeLock}/>
					lock canvas ({String(paused)})
				</label>
			</div>
			<div>current size: {expand.width}x{expand.height}</div>
			<div>
				new size:
				<input size={5} value={width} onChange={handleChangeWidth} onBlur={handleBlurWidth} />
				x
				<input size={5} value={height} onChange={handleChangeHeight} onBlur={handleBlurHeight} />
			</div>
			<div>
				corner:
			</div>
			<div>
				<input type="radio" name="corner" id={ECorner.LT} checked={corner === ECorner.LT} onChange={handleClickCorner} />
				<input type="radio" name="corner" id={ECorner.RT} checked={corner === ECorner.RT} onChange={handleClickCorner} />
			</div>
			<div>
				<input type="radio" name="corner" id={ECorner.LB} checked={corner === ECorner.LB} onChange={handleClickCorner} />
				<input type="radio" name="corner" id={ECorner.RB} checked={corner === ECorner.RB} onChange={handleClickCorner} />
			</div>
			<div>
				shift: ({corner}) {shiftX}, {shiftY}
			</div>
			<div>
				Palette: ({colorScheme})
				<select value={colorScheme} onChange={handleSelectColorScheme}>
					{Object.entries(colorSchemes).map(([key, list]) => (
						<option key={key} value={key}>
							{key} {typeof list === 'string' ? '' : `(${Object.keys(list).length} colors)`}
						</option>
					))}
				</select>
			</div>
			<div>
				<button disabled={isDisabledSaveButton} onClick={saveExpand}>update</button>
			</div>
		</Block>
	);
};
