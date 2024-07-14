const { parseCookies } = require('../helpers');
const { getTotalPixels, getTopLeaderboard } = require('../utils/stats');
const { getUserData } = require('../utils/auth');
const { getSessionUserName } = require('../utils/sessions');

const stats = (req, res) => {
	const { token } = parseCookies(req.headers.cookie);
	const total = getTotalPixels();
	const leaderboard = getTopLeaderboard(10, token)
		.map((item) => {
			const user = getUserData(item.id);

			return {
				name: user?.name || getSessionUserName(item.id),
				count: item.count,
				place: item.place,
				platform: user?.area,
			};
		});

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({
		total,
		leaderboard,
	}));
};

module.exports = {
	stats,
};
