import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';

import cn from 'classnames';

import { useMobileLayout } from '../../../../hooks/useMobileLayout';
import { useDraggable } from '../../../../hooks/useDraggable';
import {
	rgbToHex,
	hexToRgb,
	isHEX,
	blendColorWhiteBlack,
	invertHex,
	expandShortHex,
} from '../../../../helpers/color';

import * as s from './ColorPicker.module.scss';

const colors = [
	[255, 0, 0],   // red
	[255, 255, 0], // yellow
	[0, 255, 0],   // green
	[0, 255, 255], // cyan
	[0, 0, 255],   // blue
	[255, 0, 255], // magenta
	[255, 0, 0]    // red (again)
];

const interpolateColor = (i: number, index: number, ratio: number) =>
	Math.round(colors[index][i] + (colors[index + 1][i] - colors[index][i]) * ratio);

const getColorInRainbow = (percent: number) => {
	let position = (percent / 100) * 6;
	let index = Math.min(5, Math.floor(position));
	let ratio = position - index;

	return rgbToHex([
		interpolateColor(0, index, ratio),
		interpolateColor(1, index, ratio),
		interpolateColor(2, index, ratio),
	]);
};

const getColorInPicker = (percent: number, percentX: number, percentY: number) => {
	const color = getColorInRainbow(percent);

	return blendColorWhiteBlack(color, (100 - percentX) / 100, percentY / 100);
};

const calculateDistance = (rgb1: any, rgb2: any) =>
	Math.sqrt(
		(rgb1[0] - rgb2[0]) ** 2 +
		(rgb1[1] - rgb2[1]) ** 2 +
		(rgb1[2] - rgb2[2]) ** 2
	);

const getPickerPosition = (targetColor: string) => {
	const targetRgb = hexToRgb(targetColor);

	let bestMatch = null;
	let bestDistance = Infinity;

	for (let percent = 0; percent <= 100; percent += 10) {
		for (let percentX = 0; percentX <= 100; percentX += 10) {
			for (let percentY = 0; percentY <= 100; percentY += 10) {
				const color = getColorInPicker(percent, percentX, percentY);
				const rgb = hexToRgb(color);

				const distance = calculateDistance(rgb, targetRgb);

				if (distance < bestDistance) {
					bestDistance = distance;
					bestMatch = [percent, percentX, percentY];
				}
			}
		}
	}

	const [bestPercent, bestPercentX, bestPercentY] = bestMatch as any;

	for (let percent = Math.max(0, bestPercent - 1); percent <= Math.min(100, bestPercent + 1); percent++) {
		for (let percentX = Math.max(0, bestPercentX - 1); percentX <= Math.min(100, bestPercentX + 1); percentX++) {
			for (let percentY = Math.max(0, bestPercentY - 1); percentY <= Math.min(100, bestPercentY + 1); percentY++) {
				const color = getColorInPicker(percent, percentX, percentY);
				const rgb = hexToRgb(color);
				const distance = calculateDistance(rgb, targetRgb);

				if (distance < bestDistance) {
					bestDistance = distance;
					bestMatch = [percent, percentX, percentY];
				}
			}
		}
	}

	return bestMatch;
};

interface Props {
	color: string;
	pickedColor?: string;
	slot: string;
	onChange(value: string): void;
	onClose(): void;
	onDelete(): void;
	onPick(value?: boolean): void;
}

export const ColorPicker: React.FC<Props> = ({ color = '#ff0000', pickedColor, slot, onChange, onClose, onDelete, onPick }) => {
	const [baseColor, setBaseColor] = useState('#ff0000');
	const [pickerColor, setPickerColor] = useState('#ff0000');
	const [textColor, setTextColor] = useState('#ff0000');
	const [percent, setPercent] = useState(0);
	const [percentXY, setPercentXY] = useState([0, 0]);
	const refRainbow = useRef(null);
	const refPicker = useRef(null);

	const isMobile = useMobileLayout();

	const { anchorRef, draggableRef } = useDraggable({
		x: isMobile ? window.innerWidth - 250 : 200,
		y: isMobile ? window.innerHeight - 350 : window.innerHeight - 400
	});

	const handleClickRainbow = (event: any) => {
		const rect = (refRainbow.current as any).getBoundingClientRect();
		const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

		setPercent(y);
		setBaseColor(getColorInRainbow(y));

		const color = getColorInPicker(y, percentXY[0], percentXY[1]);

		setPickerColor(color);
		setTextColor(color);
	};

	const handleClickPicker = (event: any) => {
		const rect = (refPicker.current as any).getBoundingClientRect();
		const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
		const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
		const color = blendColorWhiteBlack(baseColor, (100 - x) / 100, y / 100);
		
		setPercentXY([x, y]);
		setPickerColor(color);
		setTextColor(color);
	};

	const handleChangeText = (event: any) => {
		setTextColor(event.target.value);

		if (event.target.value !== pickerColor && isHEX(event.target.value)) {
			updateColorForm(event.target.value);
		}
	};

	const handleBlurText = () => {
		if (textColor === pickerColor) {
			return;
		}

		if (isHEX(textColor)) {
			updateColorForm(expandShortHex(textColor));
		} else {
			setTextColor(expandShortHex(pickerColor));
		}
	};

	const updateColorPosition = (color: string) => {
		const [_percent, _percentX, _percentY] = getPickerPosition(expandShortHex(color)) as any;

		setBaseColor(getColorInRainbow(_percent));
		setPercent(_percent);
		setPercentXY([_percentX, _percentY]);
	};

	const updateColorForm = (color: string) => {
		const longColor = expandShortHex(color);

		setPickerColor(longColor);
		setTextColor(color);

		updateColorPosition(longColor);
	};

	const invertedColor = useMemo(
		() => invertHex(expandShortHex(pickerColor)),
		[pickerColor],
	);

	const handleSave = () => {
		if (!isHEX(pickerColor)) {
			return;
		}

		onChange(pickerColor);
		onClose();
	};

	useEffect(() => {
		if (isHEX(color)) {
			updateColorForm(color);
		}
	}, [color]);

	useEffect(() => {
		if (pickedColor && isHEX(pickedColor)) {
			updateColorForm(pickedColor);
		}
	}, [pickedColor]);

	return (
		<div className={s.root} ref={draggableRef}>
			<div className={s.draggable} ref={anchorRef}>
				<button className={s.close} onClick={onClose}>&times;</button>
			</div>
			<div>
				<div className={s.wrapper}>
					<div
						ref={refPicker}
						className={cn(s.picker, s.color)}
						style={{ backgroundColor: baseColor }}
						onClick={handleClickPicker}
					>
						<div className={cn(s.picker, s.gradientWhite)}>
							<div className={cn(s.picker, s.gradientBlack)}></div>
						</div>
						<div className={s.dot} style={{
							left: `${percentXY[0]}%`,
							top: `${percentXY[1]}%`,
							backgroundColor: invertedColor,
						}}></div>
					</div>
					<div className={s.rainbow} ref={refRainbow} onClick={handleClickRainbow}>
						<div className={s.arrow} style={{ top: `${percent}%` }}></div>
					</div>
				</div>
				<div className={s.info}>
					<div className={s.output} style={{ backgroundColor: pickerColor }}></div>
					<div className={s.colorLabel}>Цвет:</div>
					<input
						value={textColor}
						size={7}
						className={s.input}
						onChange={handleChangeText}
						onBlur={handleBlurText}
						onSubmit={handleBlurText}
					/>
					<button className={s.pickButton} onClick={onPick}></button>
				</div>
				<div className={s.footer}>
					<button className={s.button} onClick={handleSave}>OK</button>
					<button className={s.button} onClick={onClose}>Отмена</button>
					{slot && (
						<button className={s.button} onClick={onDelete}>Удалить</button>
					)}
				</div>
			</div>
		</div>
	);
};
