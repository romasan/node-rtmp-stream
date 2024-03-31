import { useRef, useState, useEffect } from 'react';

export const useHover = ({ element, scale }) => {
	const [x, setX] = useState(-1);
	const [y, setY] = useState(-1);

	// const getPosition = () => {};

	useEffect(() => {
		if (element) {
			// TODO add event listeners
			return () => {
				// 	TODO remove event listeners
			};
		}
	}, [element]);

	return {
		x,
		y,
	}
}