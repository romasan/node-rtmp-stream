# basic

- [ ] auth by chat command
- [ ] auth by vkplay/twitch
- [ ] countdown
- [x] githib actions deploy (front only?)
- [x] ssl support
- [ ] read chat from stream?
- [ ] support for multiple colors
- [x] bot protection
- [ ] session caching

# admin panel

- [x] add admin route
- [ ] change countdown
- [ ] freeze area
- [ ] cover up area
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
- [ ] contrast border for pixel placeholder

# configurate

SSL
```bash
sudo certbot certonly --webroot -w /var/www/html -d api.pixelbattle.online
sudo cp /etc/letsencrypt/live/api.pixelbattle.online/* ./
```
