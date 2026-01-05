const http = require('http');

const callback = (req, res) => {
    console.log('==== origin:', req.headers['origin']);
    console.log('==== url:', req.url);

    res.setHeader('Access-Control-Allow-Origin', 'https://tg.pixelbattles.ru');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

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
