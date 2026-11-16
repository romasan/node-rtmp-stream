export const clientRoute = (path: '/' | '/timelapse/') => {
	const { pathname, hash } = document.location;
	return pathname.startsWith('/react/') ? `/react${path}${hash}` : path;
};
