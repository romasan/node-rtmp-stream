# basic

(!) - high priority

- [x] auth by twitch
- [x] auth by discord
- [x] auth by telegram
- [ ] auth by vkplay
- [ ] auth by vk
- [x] auth by steam
- [x] countdown
- [x] githib actions deploy (front only?)
- [x] ssl support
- [x] bot protection
- [x] session caching
- [x] replace res/ -> assets/
- [x] online users list
- [x] reset countdown on login
- [x] buy pixel-battle.ru | pixelbattles.ru
- [x] use one countdown for every session with one authorization
- [x] fix zoom on click on non canvas and "pixel" elements
- [x] chat mute user
- [x] add datetime for logs
- [x] chat moderation (delete all by user)
- [ ] read chat from stream(s)?
- [ ] support for multiple colors
- [ ] twitch extension (https://dev.twitch.tv/docs/extensions/)
- [ ] rename all qq to admin or super
- [ ] use one countdown for active unauthorized users with one ip address
- [x] do not allow more than one (or percentage of the number online) user with one IP address
- [ ] integration tests
- [ ] webassembly + canvas =) rust?
- [x] add to telegram web app
- [ ] add qr to stream) (like https://github.com/hip-hyena/PaintBot)
- [x] chat rate limit
- [ ] check has new banned users/IP in pixels.log
- [ ] rating for groups/squads/tags
- [ ] achievements!
	- used all colors;
	- joined the squad;
	- put 100, 1k, 10k, 100k pixels;
	- put dots without leaving for 1, 8, 24 hours;
	- participated every day for a week;
- [ ] chat slow mode
- [ ] chat messages from user
- [ ] chat delete all for banned
- [ ] fix typescript warnings and remove all "any" plug
- [ ] use account uuid for stats
- [ ] moderators tools
	- users on selected region, with count of pixel (ban status, count of pixel inside / outside region, registration date, chat messages count)
	- ban / mute controls in "whose pixel" panel, ant banned status
	- checbox, translate to chat message "<username> is banner by <moderator>"
	- control for fast show activity map for session / username in "whose pixel" panel
	- chat moderation in separate wide window
	- update moderation panel layout
	- add popup messages on ban user (banned <username> / <username> already banned)
	- tool for restore canvas without pixels of banned users (with pause mode)
	- preview canvas without pixels of banned users
	- activity map banned and unbanned (banned colors for sessions)
	- mute / ban with timeout
	- ban with chat access
	- admin add / remove moderators
	- log of moderation actions
	- newest map by index for session / nick / ip

# admin panel

- [x] add admin route
- [x] update stream frame
- [x] cover up area
- [x] change countdown in runtime
- [x] preview last changes, heatmap, changes by user
- [ ] change countdown for uuid/nick/ip
- [ ] freeze area
- [ ] statistic (online, total pixels, online/pixels by hour/day)
- [ ] get pixel author (uuid, IP, nickname, auth service)
- [ ] get users on IP address
- [ ] ban by uuid (shadow)
- [ ] ban by IP address (shadow)

# server

- [x] backup frames / pixels for timelapse
- [x] auto restart on fail (fix ffmpeg problems)
- [x] auto restart: write process.pid to file
- [x] auto restart (use PM2)
- [x] freeze frame to stream from admin panel
- [x] move ssl handle to nginx? (https://www.sitepoint.com/configuring-nginx-ssl-node-js/)
- [x] const.js -> config.json
- [x] if not use database, replace: pixels.log, inout.png, pid, expands.log, messages.log, sessions/x/x/x/, sessions/auth.json, sessions/list, sessions/logout.log to DB/
- [x] sessios file structure like git objects a/b/c/abcdefg000000 -> ab/abcdefg000000
- [x] replace server/tools/getPixelInfo -> server/
- [x] remove event emitter
- [ ] auto restart: add servise with chatbot for notification
- [ ] fit the canvas into the frame
- [ ] rotated access log
- [ ] use database instead files
- [ ] binary ws messages? (protobufjs)
- [ ] merge token|uuid vars name?
- [ ] use nestjs?
- [ ] stress testing (apache benchmark?)
- [ ] DDoS protection

# web

- [x] drawing
- [x] zooming
- [x] select color
- [x] zooming at cursor
- [x] zooming at mobile
- [x] fix pixel cursor position
- [x] mobile layout
- [x] link to stream
- [x] contrast border for pixel placeholder
- [x] timelapse page
- [x] build svg inside page (https://github.com/albinotonnina/parcel-plugin-inlinesvg)
- [x] replace Bar panel to App
- [ ] check is offline
- [ ] FAQ page
- [ ] fix layout after resize
- [ ] dont rerender canvas conponent in update countdown timer (and on move pixel)
- [ ] scale with canvas instead of css (for safari?)
- [ ] decomposite canvas component by hooks (useDrag, useWheel, useTouch)
- [ ] offline indicator
- [ ] add react router and make SPA
- [ ] play button in center of timelapse canvas
- [ ] hash link to coordinate, like https://pixelbattles.ru/#100,200 go to position, scale, higlight pixel
- [ ] fix countdown progress position on reload page
- [ ] fix coundown on login to ended game

# page with infinity map

- [ ] parts of map like geo

# configurate

# how to update ssl certificate

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d api.pixelbattles.ru
sudo systemctl start nginx
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

/etc/nginx/sites-available/example

```
server {
	listen 80;
	listen 443 ssl;
	server_name api.pixelbattles.ru;

	# allow 93.100.95.191;
	# deny all;
	# deny 192.3.228.238;

	location / {
		proxy_pass http://localhost:7000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		# proxy_set_header Forwarded $proxy_add_forwarded;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		# proxy_set_header X-Forwarded-For "$realip_remote_addr";
		proxy_cache_bypass $http_upgrade;
	}

	ssl_certificate /etc/letsencrypt/live/api.pixelbattles.ru/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/api.pixelbattles.ru/privkey.pem;
}
```
