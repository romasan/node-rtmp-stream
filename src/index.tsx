import React from 'react'
import { createRoot } from 'react-dom/client';
import { App } from "./App";
import { start } from './lib/api';
import { connect } from './lib/ws';

start().then((text) => {
	if (text === 'fail') {
		document.location.reload();

		return;
	}

	connect();
});

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
