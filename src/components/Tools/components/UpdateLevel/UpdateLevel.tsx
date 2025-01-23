import React, { FC, useState, useMemo } from 'react';

import { Block } from '../Block';

import {
	get,
	put,
	patch,
} from '../../helpers';

// import * as s from './UpdateLevel.module.scss';

export const UpdateLevel: FC = () => {
	// const [canvasConf, setCanvasConf] = useState<any>({});

	// const onChangeFreeze = (event: any) => {
	// 	setCanvasConf((value: any) => ({ ...value, freezed: event.target.value === 'true' }));
	// 	patch('streamSettings', JSON.stringify({ ...canvasConf, freezed: event.target.value === 'true' }), 'TEXT');
	// };

	// const updateFreezedFrame = () => {
	// 	put('updateFreezedFrame', null, 'TEXT');
	// };

	const onOpen = () => {
		// get('streamSettings')
		// 	.then(setCanvasConf)
		// 	.catch(() => {/* */});
	};

	// const checked = useMemo(() => {
	// 	return canvasConf.freezed || false;
	// }, [canvasConf]);

	return (
		<Block title="* Полотно и палитра" onOpen={onOpen}>
			<div>TODO</div>
			<div>
				<label>
					<input type="checkbox" />
					lock canvas
				</label>
			</div>
			<div>current size: 100x100</div>
			<div>
				new size:
				<input size="5" value="100" />
				x
				<input size="5" value="100" />
			</div>
			<div>
				corner:
			</div>
			<div>
				<input type="radio" name="corner" id="lt" checked />
				<input type="radio" name="corner" id="rt" />
			</div>
			<div>
				<input type="radio" name="corner" id="lb" />
				<input type="radio" name="corner" id="rb" />
			</div>
			<div>
				Palette:
				<select>
					<option>truecolor</option>
					<option selected>pal24</option>
					<option>pal16</option>
					<option>pal2</option>
					<option>pal1</option>
					<option>custom</option>
				</select>
			</div>
			<div>
				<button>update</button>
			</div>
		</Block>
	);
};
