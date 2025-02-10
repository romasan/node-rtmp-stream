import React, { FC, useState } from 'react';

import cn from 'classnames';

import { useDraggable } from '../../hooks/useDraggable';

import { EMode } from '../Canvas';

import { ToolsContext } from './context';

import {
	Block,
	Stats,
	Stream,
	PixelStats,
	FillSquare,
	Maps,
	Bans,
	Metrics,
	Chat,
	Countdown,
	Expand,
	Final,
} from './components';

import * as s from './Tools.module.scss';

interface Props {
	canvas: any;
	coord: any;
	range: any;
	color: string;
	expand?: {
		width: number;
		height: number;
		shiftX: number;
		shiftY: number;
		colorScheme: string;
	}
	setCanvasMode: (value: EMode) => void;
}

export const Tools: FC<Props> = ({
	canvas,
	coord,
	range,
	color,
	expand,
	setCanvasMode,
}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 330, y: 10});

	const [opened, setOpened] = useState('');
	const [expandWindow, setExpandWindow] = useState(true);

	const onToggle = () => {
		setExpandWindow((value) => !value);
	};

	return (
		<ToolsContext.Provider value={{
			opened,
			setOpened,
		}}>
			<div className={s.root} ref={draggableRef}>
				<div className={s.draggable} ref={anchorRef}>
					<button className={cn(s.close, { [s.toggled]: !expand })} onClick={onToggle}>
						<div>&gt;</div>
					</button>
				</div>
				<div className={s.content}>
					{expandWindow && (
						<>
							<Stats canvas={canvas} />
							<Metrics />
							<Stream />
							<PixelStats coord={coord} />
							<Maps canvas={canvas} />
							<FillSquare
								canvas={canvas}
								expand={expand}
								range={range}
								color={color}
								setCanvasMode={setCanvasMode}
							/>
							<Bans />
							<Chat />
							<Countdown />
							<Expand />
							<Block title="* Откат полотна к состоянию">
								<div>TODO</div>
								<div>
									<label>
										<input type="checkbox" />
										lock canvas
									</label>
								</div>
								<div>
									<button>Предпросмотр без забаненных</button>
								</div>
								<div>
									<button>RELOAD ALL (WAWE)</button>
								</div>
							</Block>
							<Final />
						</>
					)}
				</div>
			</div>
		</ToolsContext.Provider>
	);
};
