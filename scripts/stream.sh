#!/bin/bash

AUDIO_PATH=$(perl -nle 'print $1 if /"inputAudio":\s*"(.*?)"/' ./server/config.json)
OUTPUT_RTMP=$(perl -nle 'print $1 if /"rtmpHostKey":\s*"(.*?)"/' ./server/config.json)
FRAME_FILE=$(perl -nle 'print $1 if /"streamFile":\s*"(.*?)"/' ./server/config.json)
BG_VIDEO_FILE=$(perl -nle 'print $1 if /"bgVideo":\s*"(.*?)"/' ./server/config.json)

# while true; do
#     ffmpeg -framerate 15 -re -stream_loop -1 -f image2 -i $FRAME_FILE \
#     -i $AUDIO_PATH -vcodec libx264 -pix_fmt yuv420p -preset slow -r 15 -g 30 -f flv $OUTPUT_RTMP
#     echo "FFmpeg завершился с ошибкой. Перезапуск через 5 секунд..."
#     sleep 5
# done

# while true; do
ffmpeg -re -stream_loop -1 -i $BG_VIDEO_FILE \
    -i $AUDIO_PATH \
    -loop 1 -i $FRAME_FILE \
    -filter_complex "[2]scale='min(iw*min(1\,min(1920/iw\,1080/ih))\,1920)':'min(ih*min(1\,min(1920/iw\,1080/ih))\,1080)',format=rgba[img]; \
                    [0][img]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1[v]" \
    -map "[v]" -map 1:a \
    -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -b:a 192k \
    -f flv $OUTPUT_RTMP
#     echo "FFmpeg завершился с ошибкой. Перезапуск через 5 секунд..."
#     sleep 5
# ffmpeg -re -stream_loop -1 -i $BG_VIDEO_FILE \
#     -i $AUDIO_PATH \
#     -framerate 2 -i %04d.png \
#     -filter_complex "[2]scale='min(iw*min(1\,min(1920/iw\,1080/ih))\,1920)':'min(ih*min(1\,min(1920/iw\,1080/ih))\,1080)',format=rgba[img]; \
#                     [0][img]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1[v]" \
#     -map "[v]" -map 1:a \
#     -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -b:a 192k \
#     -f flv $OUTPUT_RTMP
# ffmpeg -re -stream_loop -1 -i $BG_VIDEO_FILE \
#     -i $AUDIO_PATH \
#     -framerate 2 -pattern_type glob -i "*.png" \
#     -filter_complex "[2]scale='min(iw*min(1\,min(1920/iw\,1080/ih))\,1920)':'min(ih*min(1\,min(1920/iw\,1080/ih))\,1080)',format=rgba[img]; \
#                     [0][img]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1[v]" \
#     -map "[v]" -map 1:a \
#     -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -b:a 192k \
    # -f mpegts "udp://127.0.0.1:1234"
# ffmpeg -re -stream_loop -1 -i $BG_VIDEO_FILE \
#     -i $AUDIO_PATH \
#     -pattern_type glob -framerate 2 -i "*.png" \
#     -filter_complex "[2]fps=2,scale='min(iw*min(1\,min(1920/iw\,1080/ih))\,1920)':'min(ih*min(1\,min(1920/iw\,1080/ih))\,1080)',format=rgba[img]; \
#                     [0][img]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1[v]" \
#     -map "[v]" -map 1:a \
#     -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -b:a 192k \
#     -f flv $OUTPUT_RTMP
# ffmpeg -re -f image2 -framerate 2 -i %d.png -vf "loop=loop=-1:size=2:start=1" -c:v libx264 -preset veryfast -f flv $OUTPUT_RTMP
# ffmpeg -framerate 15 -re -stream_loop -1 -f image2 -i 1.png -i $AUDIO_PATH -vcodec libx264 -pix_fmt yuv420p -preset slow -r 15 -g 30 -f flv $OUTPUT_RTMP
# ffmpeg -framerate 15 -re -stream_loop -1 -f image2 -i %d.png -i $AUDIO_PATH -vcodec libx264 -pix_fmt yuv420p -preset slow -r 15 -g 30 -f flv $OUTPUT_RTMP
# done
