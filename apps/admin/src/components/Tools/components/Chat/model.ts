export interface ChatMessage { id: string; name: string; area: string; text: string; time: number | null; }

export const filterMessages = (messages: ChatMessage[], query: string): ChatMessage[] => {
	const search = query.trim().toLocaleLowerCase();
	return messages.filter(message => !search || message.name.toLocaleLowerCase().includes(search) || message.text.toLocaleLowerCase().includes(search));
};
