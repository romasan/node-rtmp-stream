const http = require('http');
const { v4: uuid } = require('uuid');

const parseCookies = (cookies = '') => {
    return cookies
        .split(';')
        .map((item) => item.split('='))
        .reduce((list, [key, value]) => ({ ...list, [key?.trim()]: value?.trim() }), {});
};

const callback = (req, res) => {
    const { token } = parseCookies(req.headers.cookie || '');
    const newToken = uuid();

    console.log('==== origin:', req.headers['origin']);
    console.log('==== url:', req.url);
    console.log('==== token:', token);
    console.log('==== new token:', newToken);

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
