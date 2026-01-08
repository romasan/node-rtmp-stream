import React, { FC, useState, useRef, useContext } from 'react';

import cn from 'classnames';

import { useMobileLayout } from '../../hooks/useMobileLayout';
import { useDraggable } from '../../hooks/useDraggable';
import { useWindow } from '../../hooks/useWindow';

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

export const Content = () => {
	const { renderRef, opened } = useContext(ToolsContext);
	const [render, setRender] = useState(null);

	renderRef.current = setRender;

	return (
		<div className={cn('wideWindow', s.rightSide)}>{opened ? render : 'Select tab'}</div>
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
	const isMobile = useMobileLayout();
	const { anchorRef, draggableRef } = useDraggable({ x: 2, y: 55 });

	const [opened, setOpened] = useState('stats');
	const [expandWindow, setExpandWindow] = useState(true);
	const [wideWindow, setWideWindow] = useState(!isMobile);
	const renderRef = useRef(null);
	const [userId, setUserId] = useState<string | null>(null);

	const userWindow = useWindow({
		content: (
			// <UserContent userId={userId} />
			<div>
				<div>User Info:</div>
				<div>Nick: test</div>
				<div>UUIDs: {userId}</div>
			</div>
		),
		portal: true,
	});

	const userInfo = (userId: string) => {
		setUserId(userId);
		userWindow.open();
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
				<div className={s.root} ref={draggableRef}>
					<div className={s.draggable} ref={anchorRef}>
						<button className={cn(s.wide, { [s.wided]: !wideWindow })} onClick={onWide}>
							<div>&gt;</div>
						</button>
						<button className={cn(s.close, { [s.toggled]: !expandWindow })} onClick={onToggle}>
							<div>&gt;</div>
						</button>
					</div>
					<div className={s.content}>
						{expandWindow && (
							<div className={s.columns}>
								<div className={s.leftSide}>
									<Stats canvas={canvas} userInfo={userInfo} />
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
			{userWindow.render()}
		</>
	);
};
