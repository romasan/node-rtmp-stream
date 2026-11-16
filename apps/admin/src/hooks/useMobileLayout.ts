import mobile from 'is-mobile';

export const useMobileLayout = (): boolean => {
	const isMobile = mobile();
	const isTgMiniApp = document.location.href.includes('tg.');

	return isMobile || isTgMiniApp;
};
