import React, { FC, useState, useMemo } from 'react';

import { Block } from '../Block';

import {
	get,
	put,
	patch,
} from '../../helpers';

// import * as s from './Stream.module.scss';

export const Stream: FC = () => {
	const [canvasConf, setCanvasConf] = useState<any>({});

	const onChangeFreeze = (event: any) => {
		setCanvasConf((value: any) => ({ ...value, freezed: event.target.value === 'true' }));
		patch('streamSettings', JSON.stringify({ ...canvasConf, freezed: event.target.value === 'true' }), 'TEXT');
	};

	const updateFreezedFrame = () => {
		put('updateFreezedFrame', null, 'TEXT');
	};

	const onOpen = () => {
		get('streamSettings')
			.then(setCanvasConf)
			.catch(() => {/* */});
	};

	const checked = useMemo(() => {
		return canvasConf.freezed || false;
	}, [canvasConf]);

	return (
		<Block title="🎦 Трансляция" onOpen={onOpen}>
			<div>
				<input type="radio" id="realTime" name="stream" checked={!checked} value="false" onChange={onChangeFreeze} />
				<label htmlFor="realTime">В реальном времени</label>
			</div>
			<div>
				<input type="radio" id="frame" name="stream" checked={checked} value="true" onChange={onChangeFreeze} />
				<label htmlFor="frame">Один кадр</label>
			</div>
			{canvasConf.freezed && (
				<div>
					<button onClick={updateFreezedFrame}>Обновить кадр</button>
				</div>
			)}
		</Block>
	);
};
