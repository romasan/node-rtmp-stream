const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const path=require('node:path');
function load(name,fetch){
 const filename=name==='marker'?'../../apps/admin/src/components/Canvas/marker.ts':'../../apps/admin/src/components/Tools/components/Stats/'+name+'.ts';
 const source=fs.readFileSync(path.resolve(__dirname,filename),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','exports','module','fetch',compiled)(()=>({APIhost:'http://admin.test'}),module.exports,module,fetch);
 return module.exports;
}
test('groups multiple connections of a session, retaining activity and the latest timestamp',()=>{
 const {groupSessions,filterSessions}=load('model');
 const groups=groupSessions([
  {uuid:'one',name:'Fox',active:false,lastActivity:100},
  {uuid:'one',name:'Fox',active:true,lastActivity:200},
  {uuid:'two',name:'Fox',active:false,lastActivity:null},
  {uuid:null,name:'',active:false,lastActivity:null},
  {uuid:null,name:'',active:false,lastActivity:null},
 ]);
 assert.equal(groups.length,4);
 assert.deepEqual(groups[0],{key:'one',uuid:'one',name:'Fox',active:true,lastActivity:200,connections:2});
 assert.equal(filterSessions(groups,'ONE',false).length,1);
 assert.equal(filterSessions(groups,'fox',true).length,1);
 assert.equal(filterSessions(groups,'fox',false).length,2);
});
test('coverage uses free cells and canvas area, not the number of pixel placements',()=>{
 const {getCoverage}=load('model');
 assert.deepEqual(getCoverage(80,{width:10,height:10}),{capacity:100,free:80,occupied:20,percent:20});
 assert.equal(getCoverage(0,{width:10,height:10}).percent,100);
 for(const empty of [null,-1,101,NaN]) assert.equal(getCoverage(empty,{width:10,height:10}),null);
 assert.equal(getCoverage(0,{width:0,height:10}),null);
});
test('duration formatting never produces NaN or undefined for absent activity',()=>{
 const {formatDuration}=load('model');
 assert.equal(formatDuration(null),'—');
 assert.equal(formatDuration(NaN),'—');
 assert.equal(formatDuration(0),'0 с');
 assert.equal(formatDuration(65000),'1 мин. 5 с');
 assert.equal(formatDuration(90061000),'1 д. 1 ч. 1 мин.');
});
test('marker translates world coordinates with shifts and rejects pixels outside the canvas',()=>{
 const {getMarkerPosition}=load('marker');
 const geometry={width:420,height:420,shiftX:210,shiftY:310};
 assert.deepEqual(getMarkerPosition({x:-210,y:-310},geometry),{x:0,y:0});
 assert.deepEqual(getMarkerPosition({x:209,y:109},geometry),{x:419,y:419});
 assert.equal(getMarkerPosition({x:210,y:109},geometry),null);
 assert.equal(getMarkerPosition({x:-211,y:0},geometry),null);
 assert.equal(getMarkerPosition({x:0.5,y:0},geometry),null);
});
const raw={online:{uniq:2,open:3,all:3,countByActivity:1},perMin:0,perHour:20,total:1000,empty:80,uptime:60000,lastActivity:null,coord:{},color:null};
test('loads zero counters and empty activity without inventing a last pixel',async()=>{
 const api=load('api',async()=>Response.json(raw));
 const result=await api.loadStats();
 assert.equal(result.perMin,0);
 assert.equal(result.online.unique,2);
 assert.equal(result.empty,80);
 assert.equal(result.lastPixel,null);
});
test('loads negative coordinates, nullable timestamps and legacy numeric sizes',async()=>{
 const api=load('api',async url=>Response.json(url.endsWith('/expand')?{width:'10',height:'10',shiftX:'5',shiftY:'5'}:{...raw,lastActivity:1000,coord:{x:-2,y:0},color:'#abcdef',lastUserUUID:'session',lastUserName:'Fox'}));
 const stats=await api.loadStats();
 assert.deepEqual(stats.lastPixel,{x:-2,y:0,color:'#abcdef',uuid:'session',name:'Fox',ip:null,age:1000});
 assert.deepEqual(await api.loadGeometry(),{width:10,height:10,shiftX:5,shiftY:5});
});
test('online connections may have an unset last-activity field',async()=>{
 const api=load('api',async()=>Response.json([{uuid:'one',name:'Fox',active:false},{name:null,active:false}]));
 assert.deepEqual(await api.loadOnline(),[
  {uuid:'one',name:'Fox',active:false,lastActivity:null},
  {uuid:null,name:'',active:false,lastActivity:null},
 ]);
});
test('nickname lookup encodes query characters and deduplicates sessions',async()=>{
 const api=load('api',async url=>{assert.equal(url,'http://admin.test/admin/user?nick=Fox%26Friend%20%23%2B');return Response.json({uuids:['one','one','two']});});
 assert.deepEqual(await api.findSessions('Fox&Friend #+'),['one','two']);
});
test('rejects invalid or unauthorized responses and forwards request cancellation',async()=>{
 let api=load('api',async()=>Response.json({}));
 await assert.rejects(api.loadStats(),/сводк/);
 await assert.rejects(api.loadOnline(),/сесси/);
 api=load('api',async()=>new Response('no',{status:401}));
 await assert.rejects(api.loadStats(),/Войдите снова/);
 const controller=new AbortController();
 api=load('api',async(_url,options)=>{assert.equal(options.signal,controller.signal);assert.equal(options.credentials,'include');return Response.json(raw);});
 await api.loadStats(controller.signal);
});
test('focuses the marker in an unobscured part of the viewport at the current zoom',()=>{
 const {getMarkerFocus}=load('marker');
 const point={x:210,y:310};
 const viewport={width:1280,height:720};
 assert.deepEqual(getMarkerFocus(point,viewport,1,()=>true),{x:429.5,y:49.5});
 assert.deepEqual(getMarkerFocus(point,viewport,2,target=>target.x>650),{x:589.5,y:49.5});
 assert.deepEqual(getMarkerFocus(point,viewport,1,()=>false),{x:429.5,y:49.5});
});
