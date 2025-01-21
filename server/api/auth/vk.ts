// import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
// import { authorizeUser } from '../../utils/auth';

const vk = (req: IncomingMessage, res: ServerResponse) => {
    if (req.url?.startsWith('/auth/vk')) {
        // const query: any = url.parse(req.url, true).query;

        //     authorizeUser(token, {
        //         ...query,
        //         _authType: 'vk',
        //     });

        //     res.writeHead(302, { Location: host });
        //     res.end();

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('Ошибка, <a href="/auth/vk">попробуйте ещё раз</a>');

        return true;
    }

    return false;
};

export default vk;
