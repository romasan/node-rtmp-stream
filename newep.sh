#!/bin/bash

cd ./server
mkdir archive
mkdir archive/s1e1
mv pixels.log archive/s1e1/
mv expands.log archive/s1e1/
mv inout.png archive/s1e1/
echo -n > pixels.log
echo "0;0;120;120;0;0" > expands.log
npm run tools recover ./server/pixels.log NOIMAGE ./server/inout.png 120 120
