import { createContext } from 'react';

export const ToolsContext = createContext<{
	setOpened?: Function;
	opened?: string;
}>({});
