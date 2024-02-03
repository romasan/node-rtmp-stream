// https://git.io/GeoLite2-City.mmdb
// https://github.com/P3TERX/GeoLite.mmdb

const maxmind = require('maxmind').default;

const lookup = await maxmind.open('./GeoLite2-City.mmdb');

const getIpInfo = (ip) => {
	const data = lookup.get(ip);

	return {
		country: data?.country?.names?.en,
		city: data?.city?.names?.en,
	};
}

// getIpInfo('8.8.8.8');

module.exports = getIpInfo;
