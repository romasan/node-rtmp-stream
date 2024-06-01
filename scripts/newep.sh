#!/bin/bash

cd ./db
echo -n > pixels.log
echo "0;0;112;112;0;0" > expands.log
npm run tools recover ./db/pixels.log NOIMAGE ./db/inout.png 112 112