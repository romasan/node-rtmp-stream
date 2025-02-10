export const nickSanitize = (nickname: string) => {
	if (nickname === 'ㅤ') {
		return 'типа самый умный';
	}

	return nickname;
};
