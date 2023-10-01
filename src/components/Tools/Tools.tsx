import React, { FC, useRef, useState, useEffect, createContext } from 'react';

import { useDraggable } from '../../hooks/useDraggable';

// import { getToolsMessages, sendToolsMessage } from '../../lib/api';
// import ee from '../../lib/ee';

import { Block } from './components';

import { ToolsContext } from './context';

import * as s from './Tools.module.scss';

const { hostname, protocol } = document.location;
const APIhost = `${protocol}//${hostname === 'localhost' ? '' : 'api.'}${hostname.replace('www.', '')}:8080`;

const get = async (command: string, type = 'JSON') => {
	const resp = await fetch(`${APIhost}/qq/${command}`, {
		credentials: 'include',
	});

	if (type === 'JSON') {
		return await resp.json();
	}
	
	return await resp.text();
};

const push = async (command: string, payload?: any, method = 'POST', type = 'JSON') => {
	const resp = await fetch(`${APIhost}/qq/${command}`, {
		method,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: payload,
	});

	if (type === 'JSON') {
		return await resp.json();
	}

	return await resp.text();
};

const post = (command: string, payload?: any, type = 'JSON') => {
	return push(command, payload, 'POST', type);
};

const put = (command: string, payload?: any, type = 'JSON') => {
	return push(command, payload, 'PUT', type);
};

const patch = (command: string, payload?: any, type = 'JSON') => {
	return push(command, payload, 'PATCH', type);
};

interface Props {
}

export const Tools: FC<Props> = ({}) => {
	const { anchorRef, draggableRef } = useDraggable({ x: document.body.offsetWidth - 330, y: 10});

	const [opened, setOpened] = useState('');
	const [canvasConf, setCanvasConf] = useState<any>({});

	const onChangeFreeze = (event: any) => {
		setCanvasConf((value: any) => ({ ...value, freezed: event.target.value === 'true' }));
		patch('streamSettings', JSON.stringify({ ...canvasConf, freezed: event.target.value === 'true' }), 'TEXT');
	};

	const updateFreezedFrame = () => {
		put('updateFreezedFrame', null, 'TEXT');
	};

	useEffect(() => {
		get('streamSettings').then(setCanvasConf);
	}, []);

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
							<input type="radio" id="realTime" name="stream" checked={!canvasConf?.freezed} value="false" onChange={onChangeFreeze} />
							<label htmlFor="realTime">В реальном времени</label>
						</div>
						<div>
							<input type="radio" id="frame" name="stream" checked={canvasConf?.freezed} value="true" onChange={onChangeFreeze} />
							<label htmlFor="frame">Один кадр</label>
						</div>
						{canvasConf?.freezed && (
							<div>
								<button onClick={updateFreezedFrame}>Обновить кадр</button>
							</div>
						)}
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
