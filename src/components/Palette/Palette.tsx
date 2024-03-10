import { FC, useEffect, useState } from 'preact/compat';

import cn from 'classnames';
import mobile from 'is-mobile';

import { useDraggable } from '../../hooks/useDraggable';

import * as s from './Palette.module.scss';

interface Props {
	color: string;
	colors: any;
	expiration?: number;
	setColor(value: string): void;
}

export const Palette: FC<Props> = ({ color, colors, expiration = 0, setColor }) => {
	const isMobile = mobile();
	const [shouldShowProgress, setShowedProgress] = useState(false);
	const [isProgressInited, setIsProgressInited] = useState(false);

	const { anchorRef, draggableRef } = useDraggable({ x: 10, y: window.innerHeight - 100, ready: !isMobile });

	useEffect(() => {
		setShowedProgress(false);
		setIsProgressInited(false);

		setTimeout(() => {
			setShowedProgress(true);
		}, 0);
	}, [expiration]);

	useEffect(() => {
		if (shouldShowProgress) {
			setTimeout(() => {
				setIsProgressInited(true);
			}, 100);
		}
	}, [shouldShowProgress]);

	return (
		<div className={s.root} ref={draggableRef}>
			{!isMobile && <div className={s.draggable} ref={anchorRef}></div>}
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
								onClick={() => setColor(key)}
							/>
						))}
					</div>
				</div>

				<div className={s.countdown}>
					{shouldShowProgress && (
						<div className={s.progress} style={{
							transition: `all ${expiration - Date.now()}ms linear`,
							width: isProgressInited ? '100%' : '0%',
						}}></div>
					)}
				</div>

			</div>
		</div>
	);
};
