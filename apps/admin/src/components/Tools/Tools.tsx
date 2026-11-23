import React, { FC, useState, useRef, useContext } from 'react';

import cn from 'classnames';

import { useMobileLayout } from '../../hooks/useMobileLayout';
import { useDraggable } from '../../hooks/useDraggable';
import { useWindows } from '../../hooks/useWindow';

import { EMode } from '../Canvas';
import { CanvasPoint } from '../Canvas/marker';

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
	UserContent,
} from './components';

import * as s from './Tools.module.scss';

export const Content = () => {
	const { renderRef, opened } = useContext(ToolsContext);
	const [render, setRender] = useState(null);

	renderRef.current = setRender;

	return (
		<div className={cn('wideWindow', s.rightSide)}>{opened ? render : <span className={s.empty}>Выберите раздел</span>}</div>
	);
};

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
	onHighlightPixel?: (point: CanvasPoint | null) => void;
	setCanvasMode: (value: EMode) => void;
}

export const Tools: FC<Props> = ({
	canvas,
	coord,
	range,
	color,
	expand,
	setCanvasMode,
	onHighlightPixel,
}) => {
	const isMobile = useMobileLayout();
	const { anchorRef, draggableRef } = useDraggable({ x: 2, y: 55, hoisting: false });

	const [opened, setOpened] = useState('stats');
	const [expandWindow, setExpandWindow] = useState(true);
	const [wideWindow, setWideWindow] = useState(!isMobile);
	const renderRef = useRef(null);

	const {
		newWindow,
		windowsRender,
	} = useWindows();

	const userInfo = (query: string, filter = 'token', event?: any) => {
		const { clientX, clientY } = event || {};

		newWindow({
			x: clientX,
			y: clientY,
			height: '',
			content: <UserContent query={query} filter={filter} />,
		});
	};

	const onToggle = () => {
		setExpandWindow((value) => !value);
	};

	const onWide = () => {
		setWideWindow((value) => !value);
	};

	return (
		<>
			<ToolsContext.Provider value={{
				opened,
				wideWindow,
				setOpened,
				renderRef,
			}}>
				<div className={cn(s.root, { [s.expanded]: expandWindow, [s.widePanel]: wideWindow })} ref={draggableRef}>
					<div className={s.draggable} ref={anchorRef}>
						<span className={s.heading}>Управление</span>
						<button type="button" className={cn(s.wide, { [s.wided]: !wideWindow })} onClick={onWide} aria-label="Развернуть раздел сбоку" aria-pressed={wideWindow} title="Раздел сбоку">
							<span aria-hidden="true">↔</span>
						</button>
						<button type="button" className={cn(s.close, { [s.toggled]: !expandWindow })} onClick={onToggle} aria-label={expandWindow ? 'Свернуть панель' : 'Развернуть панель'} aria-expanded={expandWindow}>
							<span aria-hidden="true">▾</span>
						</button>
					</div>
					<div className={s.content}>
						{expandWindow && (
							<div className={s.columns}>
								<div className={s.leftSide}>
									<Stats userInfo={userInfo} onHighlightPixel={onHighlightPixel} />
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
									<Block title="🚧 Откат полотна к состоянию">
										<div>[TODO]</div>
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
									<Block title="🚧 Лог действий">
										<div>[TODO]</div>
										<div>
											<table border={1} className={s.list}>
												<tr>
													<td>User</td>
													<td>Action</td>
													<td>Details</td>
													<td>Time</td>
												</tr>
												<tr>
													<td>👑 Admin</td>
													<td>Ban (temporary)</td>
													<td><a href="#">fucker123</a> until 31.12.2099 23.59</td>
													<td>01.01.2026 15.35</td>
												</tr>
												<tr>
													<td>👷 SimpleGuy</td>
													<td>remove message</td>
													<td>from <a href="#">fucker123</a> at 31.12.2099 23.59</td>
													<td>01.01.2026 14.05</td>
												</tr>
												<tr>
													<td>👑 Admin</td>
													<td>Draw square</td>
													<td>[ -109:-25 - -89:-9 ] black, total 320 pix</td>
													<td>01.01.2026 00.35</td>
												</tr>
											</table>
										</div>
									</Block>
								</div>
								{wideWindow && (
									<Content />
								)}
							</div>
						)}
					</div>
				</div>
			</ToolsContext.Provider>
			{windowsRender()}
		</>
	);
};
