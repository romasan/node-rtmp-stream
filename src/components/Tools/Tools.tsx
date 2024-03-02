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
							<Stats canvas={canvas} />
							<Stream />
							<PixelStats coord={coord} />
							<Maps canvas={canvas} />
							<FillSquare
								canvas={canvas}
								range={range}
								color={color}
								setCanvasMode={setCanvasMode}
							/>
							<Bans />
							<Metrics />
							<Block title="Откат области без пикселей конкретного юзера?">TODO</Block>
							<Block title="Обновление констант"
								// onOpen={() => console.log('==== open #1')}
								// onClose={() => console.log('==== close #1')}
							>TODO</Block>
							<Block title="Увеличить размер полотна"
								// onOpen={() => console.log('==== open #2')}
								// onClose={() => console.log('==== close #2')}
							>
								<div>TODO</div>
								<div>
									<input type="checkbox" /> lock canvas
								</div>
								<div>999x999</div>
								<div>
									<input size="5" />
									x
									<input size="5" />
								</div>
								<div>
									<input type="radio" name="corner" checked />
									<input type="radio" name="corner" />
								</div>
								<div>
									<input type="radio" name="corner" />
									<input type="radio" name="corner" />
								</div>
								<div>
									<button>update</button>
								</div>
							</Block>
							<Block title="Выставить окончание пиксельбаттла">
								<div>TODO</div>
								<div>
									<input type="datetime-local" />
								</div>
							</Block>
						</>
					)}
				</div>
			</div>
		</ToolsContext.Provider>
	);
};
