export const shortArea = (area: string) => ({
	steam: 'ST',
	twitch: 'TV',
	discord: 'DS',
	telegram: 'TG',
}[area] || '');


export const restoreArea = (shortArea: string) => ({
	ST: 'steam',
	TV: 'twitch',
	DS: 'discord',
	TG: 'telegram',
}[shortArea] || shortArea);
