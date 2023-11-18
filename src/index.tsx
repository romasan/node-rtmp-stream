import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { App } from "./App";
import { start } from './lib/api';
import { connect as connectWS } from './lib/ws';

const connectAPI = () => {
	start().then((text) => {
		if (text === 'fail') {
			document.location.reload();
	
			return;
		}
	
		connectWS();
	}).catch(() => {});
};

connectAPI();

const container = document.getElementById('root') as HTMLElement;

document.addEventListener('DOMContentLoaded', () => {
	if (container.hasChildNodes()) {
		hydrateRoot(container, <App />);
	} else {
		createRoot(container).render(<App />);
	}
});

