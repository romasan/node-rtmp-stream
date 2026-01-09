import React, { FC, useState } from 'react';

import { Block } from '../Block';

// import {
// 	get,
// 	put,
// 	patch,
// } from '../../helpers';

export const Final: FC = () => {
	const [timeDate, setTimeDate] = useState(0);

	const handleChangeDateTime = (event) => {
		setTimeDate(
			new Date(event.target.value).getTime()
		);
	};

	return (
		<Block title="🚧 Выставить окончание пиксельбаттла">
			<div>[TODO]</div>
			<div>
				<input type="datetime-local" onChange={handleChangeDateTime}/>
			</div>
			<div>
				<input placeholder="MESSAGE" />
			</div>
			<div>#{timeDate}#</div>
			<div>
				<button>save</button>
			</div>
		</Block>
	);
};
