# basic

- [ ] auth by chat command
- [ ] auth by vkplay/twitch
- [ ] cooldown
- [x] githib actions deploy (front only?)
- [x] ssl support
- [ ] read chat from stream?
- [ ] support for multiple colors
- [x] bot protection
- [ ] session caching

# admin panel

- [ ] change cooldown
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

# web
- [x] drawing
- [x] zooming
- [x] select color
- [ ] zooming at cursor
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
