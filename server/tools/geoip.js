// https://git.io/GeoLite2-City.mmdb
// https://github.com/P3TERX/GeoLite.mmdb

const fs = require('fs');
const https = require('https');
const maxmind = require('maxmind').default;

const dbFilePath = __dirname + '/../../db/GeoLite2-City.mmdb';

const fetchGeoDB = (url = 'https://git.io/GeoLite2-City.mmdb') => new Promise((resolve) => {
	const file = fs.createWriteStream(dbFilePath);

	https.get(url, (response) => {

		if ([301, 302].includes(response.statusCode)) {
			file.close();
			fetchGeoDB(response.headers.location).then(resolve);

			return;
		}

		response.pipe(file);

		file.on('close', resolve);
	});
});

let lookup = null;

const getIpInfo = async (ip) => {
	if (!fs.existsSync(dbFilePath)) {
		await fetchGeoDB();
	}

	if (!lookup) {
		lookup = await maxmind.open(dbFilePath);
	}

	const data = lookup.get(ip);

	const result = {
		country: data?.country?.names?.en,
		city: data?.city?.names?.en,
	};

	console.log('====', ip, result);
};

module.exports = {
	getIpInfo,
	fetchGeoDB,
};
