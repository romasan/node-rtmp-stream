const http = require('http');
const url = require('url');

const {
    discord: {
        port,
    }
} = require('./config.json');

const getPostPayload = (req, body = '') => new Promise((resolve, reject) => req
    .on('data', (chunk) => body += chunk.toString())
    .on('end', () => resolve(JSON.parse(body)))
    .on('error', reject)
);

const webServer = http.createServer(async (req, res) => {
    if (req.url.startsWith('/auth/discord/callback') && req.method === 'POST') {
        try {
            const {
                clientId,
                clientSecret,
                code,
                redirectUri,
            } = await getPostPayload(req);

            const urlEncoded = new URLSearchParams();

            urlEncoded.append('client_id', clientId);
            urlEncoded.append('client_secret', clientSecret);
            urlEncoded.append('code', code);
            urlEncoded.append('grant_type', 'authorization_code');
            urlEncoded.append('redirect_uri', redirectUri);
            urlEncoded.append('scope', 'identify+email');

            console.log('==== discord #1.1', {
                clientId,
                clientSecret,
                code,
                redirectUri,
            });

            // const authUrl = `https://discord.com/api/oauth2/token?${urlEncoded}`;
            const authUrl = 'https://discord.com/api/oauth2/token';

            const respToken = await fetch(authUrl, {
                method: 'POST',
                body: urlEncoded,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const jsonToken = await respToken.json();

            console.log('==== discord #1.2', jsonToken);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(jsonToken));
        } catch (error) {
            console.log('Discord hoop error:', error);

            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('failed');
        }

        return;
    }
    
    if (req.url.startsWith('/auth/discord/api/users/@me')) {
        try {
            const { token_type, access_token } = url.parse(req.url, true).query;

            console.log('==== discord #2.1', {
                token_type,
                access_token,
            });
    
            const respUserInfo = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    'authorization': `${token_type} ${access_token}`,
                }
            });

            const jsonUserInfo = await respUserInfo.json();

            console.log('==== discord #2.2', jsonUserInfo);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(jsonUserInfo));
        } catch (error) {
            console.log('Discord hoop error:', error);

            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('failed');
        }

        return;
    }

    console.log('Discord hoop unknown request:', req.url);

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');

    // res.writeHead(302, { Location: 'https://pixelbattles.ru/login/?discord' });
    // res.end();
});

webServer.listen(port/* , 'localhost' */);
