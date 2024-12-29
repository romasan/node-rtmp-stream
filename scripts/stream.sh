#!/bin/bash

AUDIO_PATH=$(perl -nle 'print $1 if /"inputAudio":\s*"(.*?)"/' ./server/config.json)
FRAME_FILE=$(perl -nle 'print $1 if /"streamFile":\s*"(.*?)"/' ./server/config.json)
BG_VIDEO_FILE=$(perl -nle 'print $1 if /"bgVideo":\s*"(.*?)"/' ./server/config.json)
OUTPUT_RTMP=$(perl -nle 'print $1 if /"rtmpHostKey":\s*"(.*?)"/' ./server/config.json)

while true; do
ffmpeg -re -stream_loop -1 -i $BG_VIDEO_FILE \
    -stream_loop -1 -i $AUDIO_PATH \
    -f image2 -loop 1 -framerate 29 -i $FRAME_FILE \
    -filter_complex "[0:v][2:v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1" \
    -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p \
    -map 1:a \
    -f flv $OUTPUT_RTMP
done
