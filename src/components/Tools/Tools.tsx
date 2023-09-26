import React, { FC, useRef, useState, useEffect, createContext } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

// import { getToolsMessages, sendToolsMessage } from '../../lib/api';
// import ee from '../../lib/ee';

import { Block } from './components';

import { ToolsContext } from './context';

import * as s from './Tools.module.scss';

interface Props {
}

export const Tools: FC<Props> = ({}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 330, y: 10});

	const [opened, setOpened] = useState('');

	return (
		<ToolsContext.Provider value={{
			opened,
			setOpened,
		}}>
			<div className={s.root} ref={draggableRef}>
				<div className={s.draggable} ref={anchorRef}></div>
				<div className={s.content}>
					<Block title="Статистика (онлайн, кол-во точек, аптайм, последняя активность)">FOO</Block>
					<Block title="Обновить кадр / разблокировать кадр">
						<div>
							<input type="radio" id="realTime" name="stream" />
							<label for="realTime">В реальном времени</label>
						</div>
						<div>
							<input type="radio" id="frame" name="stream" />
							<label for="frame">Один кадр</label>
						</div>
						<button>Обновить кадр</button>
					</Block>
					<Block title="Узнать чей пиксель">FOO</Block>
					<Block title="Откат области без пикселей конкретного юзера?">FOO</Block>
					<Block title="Статистика на карте (heatmap, цвет по юзерам)">FOO</Block>
					<Block title="Заполнение области цветом">FOO</Block>
					<Block title="Обновление констант">FOO</Block>
					<Block title="Поменять размер полотна">FOO</Block>
					<Block title="Выставить окончание пиксельбаттла">FOO</Block>
					<Block title="Управление банами">FOO</Block>
				</div>
			</div>
		</ToolsContext.Provider>
	);
}
