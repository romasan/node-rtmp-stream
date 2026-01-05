const http = require('http');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

const {
	server: {
		auth: {
			telegram: { token }
		},
	},
} = require('../config.json');

const parseCookies = (cookies = '') => {
    return cookies
        .split(';')
        .map((item) => item.split('='))
        .reduce((list, [key, value]) => ({ ...list, [key?.trim()]: value?.trim() }), {});
};

const getPostPayload = (req, type = 'text') => {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            if (type === 'json') {
                let json = {};

                try {
                    json = JSON.parse(body);
                } catch (ignore) {/* */}

                resolve(json);

                return;
            }

            resolve(body);
        });

        req.on('error', () => {
            reject();
        });
    });
};

const checkTelegramAuth = (query) => {
    const secret = crypto.createHash('sha256')
        .update(token)
        .digest();
    const checkString = Object.keys(query)
        .filter(key => key !== 'hash')
        .sort()
        .map(key => `${key}=${query[key]}`)
        .join('\n');
    const hash = crypto.createHmac('sha256', secret)
        .update(checkString)
        .digest('hex');

    return hash === query.hash;
};

function validateTelegramData(initDataStr) {
  const params = new URLSearchParams(initDataStr);

  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData')
    .update(token)
    .digest();

  const computedHash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  return computedHash === hash;
}

const callback = async (req, res) => {
    const { token: prevToken } = parseCookies(req.headers.cookie || '');
    const payload = await getPostPayload(req);
    const params = Object.fromEntries(new URLSearchParams(payload));

    const valid0 = validateTelegramData(payload);

    let user = {};
    try {
        user = JSON.parse(params.user);
    } catch (error) {
        console.log(`Error: ${error}`);
    }

    // const query = {
    //     id: user.id,
    //     first_name: user.first_name,
    //     last_name: user.last_name,
    //     username: user.username,
    //     photo_url: user.photo_url.replace('.svg', '.jpg'),
    //     auth_date: params.auth_date,
    //     hash: params.hash,
    // };

    const valid = checkTelegramAuth(params);

    const newToken = uuid();

    console.log('==== origin:', req.headers['origin']);
    console.log('==== url:', req.url);
    console.log('==== bot token:', token);
    console.log('==== prev token:', prevToken);
    console.log('==== new token:', newToken);
    console.log('==== payload:', payload);
    console.log('==== params:', params);
    console.log('==== valid0:', valid0);
    console.log('==== valid:', valid);
    console.log('==== params.hash:', params.hash);
    console.log('==== user:', user);

    res.setHeader('Access-Control-Allow-Origin', 'https://tg.pixelbattles.ru');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    res.setHeader('Set-Cookie', `token=${newToken}; Max-Age=31536000; HttpOnly`);

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('=)');
};

const debugServer = (port) => {
    webServer = http.createServer(callback);

    webServer.listen(port, 'localhost');
};

module.exports = {
	debugServer,
};
