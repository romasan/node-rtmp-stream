#!/bin/bash

AUDIO_PATH=$(grep -Po '"inputAudio": "\K[^"]+' ./server/config.json)
OUTPUT_RTMP=$(grep -Po '"rtmpHostKey": "\K[^"]+' ./server/config.json)

ffmpeg -framerate 15 -re -stream_loop -1 -f image2 -i /mnt/ramdisk/output.png -i $AUDIO_PATH -vcodec libx264 -pix_fmt yuv420p -preset slow -r 15 -g 30 -f flv $OUTPUT_RTMP
