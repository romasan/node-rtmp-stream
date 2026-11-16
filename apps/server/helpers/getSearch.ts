export const getSearch = (url: string) => url.split('?')[1]?.split('&')
	.map((e) => e.split('='))
	.reduce((list, [key, value]) => ({ ...list, [key]: value }), {}) || {};
