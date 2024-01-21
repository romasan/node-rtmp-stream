#!/bin/bash

echo -n > pixels.log
echo "0;0;112;112;0;0" > expands.log
npm run tools recover ./pixels.log NOIMAGE ./inout.png 112 112