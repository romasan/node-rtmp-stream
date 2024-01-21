export const doOnEnter = (query: string, callback: Function, cursor = 0) => {
	const wrapper = ({ key }) => {
		((cursor = query[cursor] === key ? cursor + 1 : 0) > query.length - 1) && callback();
	};

	document.body.addEventListener('keyup', wrapper);

	return () => {
		document.body.removeEventListener('keyup', wrapper);
	};
};
