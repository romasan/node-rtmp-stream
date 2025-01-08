export const shortArea = (area: string) => ({
	steam: 'ST',
	twitch: 'TV',
	discord: 'DS',
	telegram: 'TG',
}[area] || (area + area).slice(0, 2));


export const restoreArea = (shortArea: string) => ({
	ST: 'steam',
	TV: 'twitch',
	DS: 'discord',
	TG: 'telegram',
}[shortArea] || shortArea);
