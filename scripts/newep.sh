#!/bin/bash

cd ../db
mkdir archive
mkdir archive/s1e2
mv pixels.log archive/s1e2/
mv expands.log archive/s1e2/
mv inout.png archive/s1e2/
echo -n > pixels.log
echo "0;0;112;112;0;0" > expands.log
npm run tools recover ./server/pixels.log NOIMAGE ./server/inout.png 112 112
