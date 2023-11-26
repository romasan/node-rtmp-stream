#!/bin/bash

cd ..
mkdir db
mkdir db/sessions
echo -n > db/pixels.log
npm run tools recover ./db/pixels.log NOIMAGE ./db/inout.png 112 112
echo "0;0;112;112;0;0" > db/expands.log
echo -n > db/messages.log
echo -n > db/list
echo -n > db/logout.log
echo "{\"sessions\":{},\"authorized\":{}}" > db/auth.json
cp server/.env.example server/.env
