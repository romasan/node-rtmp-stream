export interface IUsers {
    sessions: Record<string, string>;
	accounts: Record<string, string[]>;
	authorized: Record<string, any>;
	nicknames: {
		discord: Record<string, string>;
		twitch: Record<string, string>;
		steam: Record<string, string>;
		telegram: Record<string, string>;
		vk: Record<string, string>;
	};
}
