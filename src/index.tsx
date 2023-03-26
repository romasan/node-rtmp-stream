import React from 'react'
import { render } from 'react-dom';
import { App } from "./App";
import { connect } from './ws';

connect();

render(<App />, document.getElementById("root"));
