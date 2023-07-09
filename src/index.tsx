import React from 'react'
import { createRoot } from 'react-dom/client';
import { App } from "./App";
import { connect } from './lib/ws';

connect();

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
