const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
function load(name, fetch) {
    const source = fs.readFileSync(path.resolve(__dirname, '../../apps/admin/src/components/Tools/components/Chat', name + '.ts'), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions:{module:ts.ModuleKind.CommonJS} }).outputText;
    const module = { exports:{} };
    new Function('require','exports','module','fetch',compiled)(() => ({APIhost:'http://admin.test'}),module.exports,module,fetch);
    return module.exports;
}
const sample = {id:'message-1',name:'PixelFox',area:'twitch',text:'Рисуем кота',time:1795424400000};
test('search matches text or nickname without changing order or the original loaded list', () => {
    const {filterMessages} = load('model');
    const messages = [sample, {...sample,id:'message-2',name:'Painter',text:'Другой рисунок'}];
    assert.deepEqual(filterMessages(messages,'PIXEL'),[sample]);
    assert.deepEqual(filterMessages(messages,'  КОТА '),[sample]);
    assert.deepEqual(filterMessages(messages,''),messages);
    assert.equal(messages.length,2);
    assert.deepEqual(filterMessages(messages,'нет совпадений'),[]);
});
test('loads the chosen number of messages and strips unused private fields', async () => {
    const api = load('api',async (url,options) => {
        assert.equal(url,'http://admin.test/admin/chat?count=300');
        assert.equal(options.credentials,'include');
        return Response.json([{...sample,token:'unused-session-token'}]);
    });
    assert.deepEqual(await api.loadMessages(300),[sample]);
});
test('supports unnamed legacy authors and numeric timestamps stored as strings', async () => {
    const api = load('api',async () => Response.json([{...sample,name:null,time:String(sample.time)}]));
    assert.deepEqual(await api.loadMessages(100),[{...sample,name:'',time:sample.time}]);
});
test('does not treat invalid or unauthorized message responses as an empty feed', async () => {
    for(const data of [{},null,[{...sample,id:null}],[{...sample,text:null}]]) {
        const api = load('api',async () => Response.json(data));
        await assert.rejects(api.loadMessages(100),/сообщени/);
    }
    const api = load('api',async () => new Response('unauthorized',{status:401}));
    await assert.rejects(api.loadMessages(100),/Войдите снова/);
});
test('requires server acknowledgement before reporting a chat mutation as successful', async () => {
    for(const response of [new Response('fail'),new Response('<html>login</html>'),new Response('ok',{status:500})]) {
        const api = load('api',async () => response);
        await assert.rejects(api.editMessage(sample.id,'new text'),/Сервер/);
    }
});
test('keeps editing, publishing and the two deletion scopes separate in the API', async () => {
    const requests = [];
    const api = load('api',async (url,options) => {requests.push([url,options]); return new Response('ok');});
    await api.editMessage(sample.id,'Edited text');
    await api.sendMessage('Admin announcement');
    await api.deleteMessage(sample.id);
    await api.deleteAuthorMessages('PixelFox');
    await api.muteAuthor('PixelFox');
    assert.deepEqual(requests.map(([url,options]) => [url,options.method,JSON.parse(options.body)]),[
        ['http://admin.test/admin/chat','PATCH',{id:sample.id,text:'Edited text'}],
        ['http://admin.test/admin/chat','POST',{text:'Admin announcement'}],
        ['http://admin.test/admin/chat','DELETE',{id:sample.id}],
        ['http://admin.test/admin/chat','DELETE',{nick:'PixelFox'}],
        ['http://admin.test/admin/ban','PUT',{type:'mute',value:'PixelFox'}],
    ]);
    assert.ok(requests.every(([,options])=>options.credentials==='include'));
});
