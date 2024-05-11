const { getOnlineCountList } = require('../../utils/ws');
const { getUserData } = require('../../utils/auth');
const { getSessionUserName } = require('../../utils/sessions');

const onlineList = (req, res) => {
	const list = getOnlineCountList().map((item) => {
		const user = getUserData(item?.uuid);

		return {
			...item,
			name: user?.name || getSessionUserName(item.uuid),
		};
	});
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(list));
};

module.exports = {
	onlineList,
};
