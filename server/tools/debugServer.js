const http = require('http');

const callback = (req, res) => {
    console.log('==== origin:', req.headers['origin']);
    console.log('==== url:', req.url);

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
