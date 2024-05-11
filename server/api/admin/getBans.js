const { getBans: getBansTool } = require('../../utils/bans');

const getBans = (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(getBansTool()));
};

module.exports = {
	getBans,
};
