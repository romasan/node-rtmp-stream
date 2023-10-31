# basic

- [ ] auth by chat command
- [x] auth by twitch
- [ ] auth by vkplay
- [x] countdown
- [x] githib actions deploy (front only?)
- [x] ssl support
- [ ] read chat from stream?
- [ ] support for multiple colors
- [x] bot protection
- [x] session caching

# admin panel

- [x] add admin route
- [x] update stream frame
- [x] cover up area
- [ ] change countdown
- [ ] freeze area
- [ ] statistic (online, total pixels, online/pixels by hour/day)
- [ ] preview last changes, heatmap, changes by user
- [ ] get pixel author (uuid, IP, nickname, auth service)
- [ ] get users on IP address
- [ ] ban by uuid (shadow)
- [ ] ban by IP address (shadow)

# server

- [x] backup frames / pixels for timelapse
- [ ] auto restart on fail (fix ffmpeg problems)
- [ ] auto restart: write process.pid to file
- [ ] auto restart: add servise with chatbot for notification
- [ ] fit the canvas into the frame
- [ ] write start datetime to file
- [ ] freeze frame to stream from admin panel
- [ ] rotated access log
- [ ] use database instead files

# web
- [x] drawing
- [x] zooming
- [x] select color
- [x] zooming at cursor
- [x] zooming at mobile
- [x] fix pixel cursor position
- [ ] go to position on click
- [ ] FAQ page
- [ ] mobile layout
- [ ] check is offline
- [x] link to stream
- [x] contrast border for pixel placeholder

# page with infinity map
 - [ ] parts of map like geo

# configurate

# how to configurate ssl certificate
```bash
sudo certbot certonly --webroot -w /var/www/html -d api.pixelbattle.online
sudo cp /etc/letsencrypt/live/api.pixelbattle.online/* ./
```

# how to render timelapse
```bash
ffmpeg -r 30 -i %08d.png -stream_loop -1 -i audio.mp3 -vf "scale=1704:960" -c:v libx264 -c:a aac -shortest output.mp4
```
or
```bash
ffmpeg -r 30 -i %08d.png -i https://play.lofiradio.ru:8000/mp3_128 -vf "scale=1704:960" -c:v libx264 -c:a aac -shortest output.mp4
```
or
```bash
ffmpeg -r 30 -i %08d.png -vf "scale=426:240" -c:v libx264 -c:a aac -shortest output.mp4
```
or
```bash
ffmpeg -i http://stream.antenne.de:80/antenne -r 30 -i %08d.png -vf "scale=1920:1080" -c:v libx264 -c:a aac -shortest output.mp4
```

```bash
ffmpeg -i bgmusic.mp3 -r 30 -i %08d.png -vf "scale=1280:720" -c:v libx264 -c:a aac -shortest output.mp4
```


# S1E2 TODO

- [ ] move and re create:
- pixels.log
- expands.log
- messages.log?
- inout.log (112x112)

- [ ] add new colors

- [ ] update .env file
- clear FINISH_TIME_STAMP
