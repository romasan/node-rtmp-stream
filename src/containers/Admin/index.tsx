import { h, render } from 'preact';
import { App } from './App';
import { start } from '../../lib/api';
import { connect } from '../../lib/ws';

start()
	.then((text) => {
		if (text !== 'qq') {
			document.location.href = '/';

			return;
		}

		connect();

		const container = document.getElementById('root');

		render(<App />, container!);
	})
	.catch(() => {/* */});
