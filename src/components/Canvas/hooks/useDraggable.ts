import { useEffect } from 'react';

const centering = (element) => () => {
//
};

export const useDraggable = ({ element, scale, anchor = 'center' }) => {
	useEffect(() => {
		if (element) {
			// TODO add event listeners
			return () => {
				// 	TODO remove event listeners
			};
		}
	}, [element]);

	return {
		centering: centering(element),
	};
};
