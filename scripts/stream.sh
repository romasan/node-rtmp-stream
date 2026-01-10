#!/bin/bash

AUDIO_PATH=$(perl -nle 'print $1 if /"inputAudio":\s*"(.*?)"/' ./server/config.json)
FRAME_FILE=$(perl -nle 'print $1 if /"streamFile":\s*"(.*?)"/' ./server/config.json)
OUTPUT_RTMP=$(perl -nle 'print $1 if /"rtmpHostKey":\s*"(.*?)"/' ./server/config.json)

cleanup() {
    echo "\n"
	pgrep -P $$ | xargs -r kill
	wait
	exit 0
}
trap cleanup SIGINT SIGTERM

while true; do
sleep 2
ffmpeg -re \
    -f image2 -loop 1 -framerate 30 -i "$FRAME_FILE" \
    -stream_loop -1 -i "$AUDIO_PATH" \
    -c:v libx264 -preset veryfast -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -f flv "$OUTPUT_RTMP"
    # -f tee "[f=flv]$OUTPUT_RTMP|[f=flv]$OUTPUT_RTMP_2"
done
