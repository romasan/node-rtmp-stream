# basic

- [x] auth by twitch
- [ ] auth by vkplay
- [x] auth by discord
- [ ] auth by vk
- [ ] auth by steam
- [x] auth by telegram
- [x] countdown
- [x] githib actions deploy (front only?)
- [x] ssl support
- [ ] read chat from stream(s)?
- [ ] support for multiple colors
- [x] bot protection
- [x] session caching
- [ ] moderations (with log)
- [x] replace res/ -> assets/
- [x] online users list
- [x] reset countdown on login
- [ ] twitch extension (https://dev.twitch.tv/docs/extensions/)
- [ ] rename all qq to admin or super
- [x] buy pixel-battle.ru | pixelbattles.ru
- [x] use one countdown for every session with one authorization
- [ ] use one countdown for active unauthorized users with one ip address
- [ ] do not allow more than one (or percentage of the number online) user with one IP address
- [ ] integration tests
- [x] fix zoom on click on non canvas and "pixel" elements
- [ ] webassembly + canvas =) rust?
- [ ] add to telegram web app (add qr to stream) (like https://github.com/hip-hyena/PaintBot)
- [ ] chat rate limit
- [ ] check has new banned users/IP in pixels.log
- [ ] rating for groups/squads/tags
- [ ] achievements!
	- used all colors;
	- joined the squad;
	- put 100, 1k, 10k, 100k pixels;
	- put dots without leaving for 1, 8, 24 hours;
	- participated every day for a week;
- [ ] chat slow mode
- [x] chat mute user
- [x] add datetime for logs
- [x] chat moderation (delete all by user)
- [ ] chat messages from user
- [ ] chat delete all for banned
- [ ] fix typescript warnings and remove all "any" plug
- [ ] mute/ban with timeout
- [ ] use account uuid for stats

# admin panel

- [x] add admin route
- [x] update stream frame
- [x] cover up area
- [x] change countdown in runtime
- [ ] change countdown for uuid/nick/ip
- [ ] freeze area
- [ ] statistic (online, total pixels, online/pixels by hour/day)
- [x] preview last changes, heatmap, changes by user
- [ ] get pixel author (uuid, IP, nickname, auth service)
- [ ] get users on IP address
- [ ] ban by uuid (shadow)
- [ ] ban by IP address (shadow)

# server

- [x] backup frames / pixels for timelapse
- [x] auto restart on fail (fix ffmpeg problems)
- [x] auto restart: write process.pid to file
- [ ] auto restart: add servise with chatbot for notification
- [x] auto restart (use PM2)
- [ ] fit the canvas into the frame
- [x] freeze frame to stream from admin panel
- [ ] rotated access log
- [ ] use database instead files
- [ ] binary ws messages?
- [x] move ssl handle to nginx? (https://www.sitepoint.com/configuring-nginx-ssl-node-js/)
- [ ] merge token|uuid vars name?
- [x] const.js -> config.json
- [x] if not use database, replace: pixels.log, inout.png, pid, expands.log, messages.log, sessions/x/x/x/, sessions/auth.json, sessions/list, sessions/logout.log to DB/
- [x] sessios file structure like git objects a/b/c/abcdefg000000 -> ab/abcdefg000000
- [x] replace server/tools/getPixelInfo -> server/
- [x] remove event emitter
- [ ] use nestjs?
- [ ] stress testing
- [ ] DDoS protection

# web

- [x] drawing
- [x] zooming
- [x] select color
- [x] zooming at cursor
- [x] zooming at mobile
- [x] fix pixel cursor position
- [ ] go to position on click
- [x] mobile layout
- [ ] check is offline
- [x] link to stream
- [x] contrast border for pixel placeholder
- [ ] FAQ page
- [x] timelapse page
- [x] build svg inside page (https://github.com/albinotonnina/parcel-plugin-inlinesvg)
- [ ] fix layout after resize
- [ ] dont rerender canvas conponent in update countdown timer (and on move pixel)
- [ ] scale with canvas instead of css (for safari?)
- [ ] decomposite canvas component by hooks (useDrag, useWheel, useTouch)
- [x] replace Bar panel to App
- [ ] offline indicator
- [ ] add react router and make SPA
- [ ] play button in center of timelapse canvas
- [ ] hash link to coordinate, like https://pixelbattles.ru/#100,200 go to position, scale, higlight pixel
- [ ] fix countdown progress position on reload page

# page with infinity map

- [ ] parts of map like geo

# configurate

# how to configurate ssl certificate

```bash
sudo certbot certonly --webroot -w /var/www/html -d api.pixelbattles.ru
```

OR

```bash
sudo certbot certonly --standalone -d api.pixelbattles.ru
sudo cp /etc/letsencrypt/live/api.pixelbattles.ru/* ./
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

# nginx

```bash
sudo apt-get install nginx
sudo nginx
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/example
sudo ln -s /etc/nginx/sites-available/example /etc/nginx/sites-enabled/example
sudo vim /etc/nginx/sites-available/example
sudo /etc/init.d/nginx restart
sudo nginx -s reload
```

```bash
sudo cp /etc/letsencrypt/live/api.pixelbattles.ru/fullchain.pem /etc/nginx/ssl/server.crt
sudo cp /etc/letsencrypt/live/api.pixelbattles.ru/privkey.pem /etc/nginx/ssl/server.key
```

/etc/nginx/sites-available/example

```
server {
	listen 80;
	listen 443 ssl;
	server_name pixelbattle.online;

	rewrite ^/$ http://www.pixelbattles.ru redirect;

	ssl_certificate /etc/nginx/ssl/server.crt;
	ssl_certificate_key /etc/nginx/ssl/server.key;
}

server {
	listen 80;
	listen 443 ssl;
	server_name www.pixelbattle.online;

	rewrite ^/$ http://www.pixelbattles.ru redirect;

	ssl_certificate /etc/nginx/ssl/server.crt;
	ssl_certificate_key /etc/nginx/ssl/server.key;
}

server {
	listen 80;
	listen 443 ssl;
	server_name api.pixelbattles.ru;

	location / {
		proxy_pass http://localhost:7000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_cache_bypass $http_upgrade;
	}

	ssl_certificate /home/r/node-rtmp-stream/ssl-cert/fullchain.pem;
	ssl_certificate_key /home/r/node-rtmp-stream/ssl-cert/privkey.pem;
}
```
