const fs = require('fs');

const notComment = (line) => line.trim()[0] !== '#';

const toBoolean = (value) => value === 'true';

const convertEnvToConfig = () => {
	const file = fs.readFileSync(__dirname + '/../.env');
	const env = file
		.toString()
		.split('\n')
		.filter(Boolean)
		.filter(notComment)
		.map((line) => line.split('='))
		.reduce((list, [key, value]) => ({ ...list, [key]: value || '' }), {});

	const defaultConfig = require(__dirname + '/../config.example.json');

	defaultConfig.stream = {
		enable: toBoolean(env.STREAM_ENABLE),
		rtmpHostKey: env.RTMP_HOST_KEY || '',
		FFMPEGLog: toBoolean(env.FFMPEG_LOG),
		inputAudio: env.INPUT_AUDIO || '',
		upscale: toBoolean(env.UPSCALE),
		freezedFrame: toBoolean(env.STREAM_FREEZED_FRAME),
		withBg: toBoolean(env.STREAM_WITH_BG),
		debugTime: toBoolean(env.STREAM_DEBUG_TIME),
	};

	defaultConfig.server = {
		host: env.WS_SERVER_HOST || '',
		port: Number(env.WS_SERVER_PORT || 0),
		secure: toBoolean(env.WS_SECURE),
		origin: env.WS_SERVER_ORIGIN || '',
		activityDuration: Number(env.ACTIVITY_DURATION || 0),
		timelapseCachePeriod: Number(env.TIMELAPSE_CACHE_PERIOD || 0),
		maxConnectionsWithOneIP: Number(env.MAX_CONNECTIONS_WITH_ONE_IP || 0),
		auth: {
			twitch: {
				clientId: env.TWITCH_AUTH_CLIENT_ID || '',
				clientSecret: env.TWITCH_AUTH_CLIENT_SECRET || '',
				redirectUri: env.TWITCH_AUTH_REDIRECT_URI || '',
			},
		},
	};

	defaultConfig.adminEmail = env.ADMIN_EMAIL || '';
	defaultConfig.finishTimeStamp = env.FINISH_TIME_STAMP || '';
	defaultConfig.finishText = env.FINISH_TEXT || '';
	defaultConfig.moderatorNicks = env.MODERATOR_NICKS || '';

	fs.writeFileSync(__dirname + '/../config.json', JSON.stringify(defaultConfig, true, 2));
};

module.exports = convertEnvToConfig;
