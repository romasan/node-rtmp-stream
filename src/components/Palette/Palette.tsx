import React, { useRef, useState, useEffect } from 'react';

import cn from 'classnames';
import mobile from 'is-mobile';

import { ColorPicker } from './components';

import { useDraggable } from '../../hooks/useDraggable';
import { useLandscape } from '../../hooks/useLandscape';
import { getRandomColor } from '../../helpers/color';

import { colorSchemes } from '../../../server/constants/colorSchemes';

import * as s from './Palette.module.scss';

interface ColorProps {
	active: boolean,
	color: string,
	canChangeColor: boolean,
	isLandscape: boolean;
	onClick(): void,
	onChange(color?: string): void,
}

const Color: React.FC<ColorProps> = ({
	active,
	color,
	canChangeColor,
	isLandscape,
	onClick,
	onChange,
}) => {
	const isMobile = mobile();
	const rootRef = useRef<null | HTMLDivElement>(null);
	const timeRef = useRef(0);
	const movedRef = useRef(false);

	const touchStartCallback = ({ target, touches }: any) => {
		movedRef.current = false;

		if (
			touches &&
			touches.length &&
			rootRef.current &&
			rootRef.current.contains(target as Node)
		) {
			timeRef.current = Date.now();
		}
	};

	const touchMoveCallback = () => {
		movedRef.current = true;
	};

	const touchEndCallback = () => {
		if (timeRef.current) {
			if (((Date.now() - timeRef.current) > 300) && !movedRef.current) {
				onChange(color);
			}

			timeRef.current = 0;
		}
	};

	useEffect(() => {
		if (isMobile) {
			document.addEventListener('touchstart', touchStartCallback);
			document.addEventListener('touchmove', touchMoveCallback);
			document.addEventListener('touchend', touchEndCallback);
		}

		return () => {
			if (isMobile) {
				document.removeEventListener('touchstart', touchStartCallback);
				document.removeEventListener('touchend', touchEndCallback);
			}
		};
	}, [isMobile, color, onChange]);

	return (
		<div
			ref={rootRef}
			className={cn(s.color, {
				[s.active]: active,
				[s.landscape]: isLandscape,
			})}
			style={{ background: color as string }}
			title={
				canChangeColor && !isMobile
					? `${color as string}\nДвойной клик для изменения цвета`
					: color as string
			}
			onClick={onClick}
			onDoubleClick={() => onChange(color)}
		/>
	);
};

interface Props {
	color: string;
	colorScheme: string;
	pickedColor?: string;
	setColor(value: string): void;
	onPick?:(value?: boolean) => void;
}

export const Palette: React.FC<Props> = ({ color, colorScheme, pickedColor, setColor, onPick }) => {
	const isMobile = mobile();
	const isLandscape = useLandscape();
	const [newColor, setNewColor] = useState(color);
	const [colors, setColors] = useState({});
	const [slot, setSlot] = useState('');
	const { anchorRef, draggableRef } = useDraggable({ x: 6, y: window.innerHeight - 68, ready: !isMobile });

	const [colorPickerIsShowed, setColorPickerIsShowed] = useState(false);

	const canChangeColor = colorScheme === 'truecolor';

	const handleColorItemChange = (colorValue?: string) => {
		const _color = isMobile ? colorValue : color;
		const _slot = canChangeColor ? (Object.entries(colors).find(([k, v]) => v === _color) || [])[0] : _color;

		setNewColor(colors && colors[_slot]);
		setSlot(_slot);
		setColorPickerIsShowed(canChangeColor);
	};

	const handleColorItemClick = (key: string, itemColor: any) => {
		setColor(canChangeColor ? itemColor as string : key)
	};

	const handleClickAddColor = () => {
		setSlot('');
		setNewColor(getRandomColor());
		setColorPickerIsShowed(true);
	}

	const handleChangeColor = (value: string) => {
		if (Object.values(colors).some((v) => v === value)) {
			return;
		}

		const _colors = {
			...colors,
			[slot || value]: value,
		};

		setColor(value);
		setColors(_colors);
		localStorage.setItem('palette', JSON.stringify(_colors));
	};

	const handleCloseColorPicker = () => {
		setColorPickerIsShowed(false);
		onPick(false);
	};

	const handleDelete = () => {
		const _colors = Object.entries(colors)
			.filter(([key]) => key !== slot)
			.reduce((list, [key, value]) => ({ ...list, [key]: value }), {});

		setColors(_colors);
		localStorage.setItem('palette', JSON.stringify(_colors));

		handleCloseColorPicker();
	};

	useEffect(() => {
		let _colors;

		if (colorScheme === 'truecolor') {
			_colors = JSON.parse(localStorage.getItem('palette') || '""') || (colorSchemes as any)[colorScheme];
		} else {
			_colors = (colorSchemes as any)[colorScheme];
		}

		setColors(_colors);
	}, [colorScheme]);

	return (
		<>
			<div className={s.root} ref={draggableRef}>
				{!isMobile && (
					<div className={s.draggable} ref={anchorRef}></div>
				)}
				<div className={s.paletteContent}>
					<div className={s.paletteControls}>
						<div className={s.currentColorWrapper}>
							<div className={s.currentColor} style={{ background: canChangeColor ? color : (colors && (colors as any)[color]) }}></div>
						</div>
						<div className={s.colors}>
							{colors && Object.entries(colors).map(([key, itemColor]) => (
								<Color
									key={key}
									color={itemColor as string}
									active={color === key}
									canChangeColor={canChangeColor}
									isLandscape={isLandscape}
									onClick={() => handleColorItemClick(key, itemColor)}
									onChange={handleColorItemChange}
								/>
							))}
							{canChangeColor && (
								<div className={cn(s.addColor, { [s.landscape]: isLandscape })} onClick={handleClickAddColor}>+</div>
							)}
						</div>
					</div>
				</div>

			</div>
			{colorPickerIsShowed && (
				<ColorPicker
					color={newColor}
					pickedColor={pickedColor}
					slot={slot}
					onChange={handleChangeColor}
					onClose={handleCloseColorPicker}
					onDelete={handleDelete}
					onPick={onPick}
				/>
			)}
		</>
	);
};
