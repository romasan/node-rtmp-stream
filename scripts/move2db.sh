#!/bin/bash

cd ../
mv server/pixels.log db/
mv server/inout.png db/
mv server/expands.log db/
mv server/messages.log db/
mv server/sessions/auth.json db/
mv server/sessions/list db/
mv server/sessions/logout.log db/
mv server/sessions db/
rm server/pid
