import { useState, useEffect } from 'react';

export const useLandscape = () => {
	const [isLandscape, setIsLandscape] = useState(document.documentElement.offsetWidth > document.documentElement.offsetHeight);

	useEffect(() => {
		const callback = () => {
			setIsLandscape(document.documentElement.offsetWidth > document.documentElement.offsetHeight);
		};

		window.addEventListener('resize', callback);

		return () => {
			window.removeEventListener('resize', callback);
		};
	}, []);

	return isLandscape;
};
