import { useState, useEffect } from 'react';

export const useScale = ({ element, outside = true, relative = 'inside', from, to }) => {
	const [scale, setScale] = useState(1);

	useEffect(() => {
		if (element) {
			// TODO add event listeners
			return () => {
				// 	TODO remove event listeners
			};
		}
	}, [element]);

	return { scale };
};
