import React, { FC, useState } from 'react';

import cn from 'classnames';

import { useDraggable } from '../../hooks/useDraggable';

import { EMode } from '../Canvas';

// import { getToolsMessages, sendToolsMessage } from '../../lib/api';
// import ee from '../../lib/ee';

import { Block } from './components/Block';

import { ToolsContext } from './context';

import {
	Stats,
	Stream,
	PixelStats,
	FillSquare,
	Maps,
} from './components';

import * as s from './Tools.module.scss';

interface Props {
	canvas: any;
	coord: any;
	range: any;
	color: string;
	setCanvasMode: (value: EMode) => void;
}

export const Tools: FC<Props> = ({
	canvas,
	coord,
	range,
	color,
	setCanvasMode,
	...props
}) => {

	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 330, y: 10});

	const [opened, setOpened] = useState('');
	const [expand, setExpand] = useState(true);

	const onToggle = () => {
		setExpand((value) => !value);
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
				<div className={s.content} {...props}>
					{expand && (
						<>
							<Stats />
							<Stream />
							<PixelStats coord={coord} />
							<Maps canvas={canvas} />
							<FillSquare
								canvas={canvas}
								range={range}
								color={color}
								setCanvasMode={setCanvasMode}
							/>
							<Block title="Откат области без пикселей конкретного юзера?">FOO</Block>
							<Block title="Обновление констант"
								onOpen={() => console.log('==== open #1')}
								onClose={() => console.log('==== close #1')}
							>TODO</Block>
							<Block title="Поменять размер полотна"
								onOpen={() => console.log('==== open #2')}
								onClose={() => console.log('==== close #2')}
							>TODO</Block>
							<Block title="Выставить окончание пиксельбаттла">TODO</Block>
							<Block title="Управление банами">TODO</Block>
						</>
					)}
				</div>
			</div>
		</ToolsContext.Provider>
	);
}
