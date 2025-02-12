import React, { useState } from 'react';

import cn from 'classnames';
import mobile from 'is-mobile';

import { ColorPicker } from './components';

import { useDraggable } from '../../hooks/useDraggable';

import * as s from './Palette.module.scss';

interface Props {
	color: string;
	colors: any;
	setColor(value: string): void;
}

export const Palette: React.FC<Props> = ({ color, colors, setColor }) => {
	const isMobile = mobile();
	const { anchorRef, draggableRef } = useDraggable({ x: 6, y: window.innerHeight - 68, ready: !isMobile });

	const [colorPickerIsShowed, setColorPickerIsShowed] = useState(false);

	const canChangeColor = true;

	return (
		<>
			<div className={s.root} ref={draggableRef}>
				{!isMobile && (
					<div className={s.draggable} ref={anchorRef}></div>
				)}
				<div className={s.paletteContent}>
					<div className={s.paletteControls}>
						<div className={s.currentColorWrapper}>
							<div className={s.currentColor} style={{ background: colors[color]}}></div>
						</div>
						<div className={s.colors}>
							{Object.entries(colors).map(([key, itemColor]) => (
								<div
									key={key}
									className={cn(s.color, { [s.active]: color === key})}
									style={{ background: itemColor as string }}
									title={itemColor as string}
									onClick={() => setColor(key)}
								/>
							))}
							{canChangeColor && (
								<div className={s.addColor} onClick={() => setColorPickerIsShowed(true)}>+</div>
							)}
						</div>
					</div>
				</div>

			</div>
			{colorPickerIsShowed && (
				<ColorPicker onChange={() => null} onClose={() => setColorPickerIsShowed(false)}/>
			)}
		</>
	);
};
