import { createContext } from 'preact';

export const ToolsContext = createContext<{
	setOpened?: Function;
	opened?: string;
}>({});
