'use strict';
const APP=new URL(self.registration.scope);
const ROOT=APP.pathname;
const CACHE_PREFIX='shikabou-distribution:'+ROOT+':';
const VERSION='0.13.1';
const CACHE=CACHE_PREFIX+VERSION;
const MARKER=ROOT+'__shikabou_cached_bundle__';
const base=[
 ['./', 'html'], ['area-map.html','html'], ['index.html','html'], ['manifest.webmanifest','manifest'],
 ...['scenery.js','palette.js','soundscape.js','journey.js','course-1-2.js','course-1-3.js','game.js','area-map.js','app.js','save.js','offline.js'].map(path=>[path,'js']),
 ...['area-map.css','save.css'].map(path=>[path,'css']),
 ...[
  'icons/app-192.png','icons/app-512.png','icons/app-maskable-512.png','icons/apple-touch-icon.png',
  'assets/shikabou-sprite.png','assets/shikabou-cycle-smile-idle-colors.png','assets/shikabou-cycle-open-tip-v1.png'
 ].map(path=>[path,'image'])
];
const allowed=new Map(base.map(([path,kind])=>[new URL(path,APP).pathname,kind]));
const isReady=async name=>(await caches.keys()).includes(name)&&!!(await (await caches.open(name)).match(MARKER));
async function savedNames(){return (await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));}
async function availableCache(){
 for(const name of await savedNames())if(await isReady(name))return name;
 return null;
}

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

async function fetchFile(path,kind){
 const url=new URL(path,self.location.origin);
 if(kind==='html'||kind==='css'||kind==='js')url.searchParams.set('v',VERSION);
 const response=await fetch(url,{credentials:'same-origin',cache:'reload',redirect:'error'});
 if(!response.ok||response.type==='opaque')throw Error('取得できません: '+path);
 const type=response.headers.get('Content-Type')||'';
 if(kind==='html'){
  if(!/text\/html/i.test(type))throw Error('ゲーム画面が取得できません');
  const html=await response.clone().text();
  if(!html.includes('v'+VERSION)&&!html.includes('v='+VERSION)&&!html.includes('Ver.'+VERSION))throw Error('ゲームのバージョンが一致しません');
  if(path===ROOT||path===ROOT+'index.html'){if(!html.includes('id="game"')||!html.includes('id="openSave"'))throw Error('ゲーム画面を確認できません');}
  else if(path===ROOT+'area-map.html'&&!html.includes('id="mapScene"'))throw Error('マップ画面を確認できません');
 }else{
  if(/text\/html/i.test(type)||kind==='image'&&!/^image\//i.test(type)||kind==='manifest'&&!/json/i.test(type))throw Error('ファイルを確認できません: '+path);
 }
 // Cache only the known game files, without server navigation or cookie metadata.
 const headers=new Headers({'Content-Type':type});
 return new Response(response.body,{status:200,headers});
}

let pending=null;
function saveGame(){
 if(pending)return pending;
 pending=(async()=>{
  if(await isReady(CACHE))return;
  const store=await caches.open(CACHE);
  try{
   const files=[...allowed];
   for(let i=0;i<files.length;i+=5){
    await Promise.all(files.slice(i,i+5).map(async ([path,kind])=>store.put(path,await fetchFile(path,kind))));
   }
   await store.put(MARKER,new Response(VERSION));
  }catch(error){await caches.delete(CACHE);throw error;}
  for(const old of await savedNames())if(old!==CACHE)await caches.delete(old);
 })().finally(()=>{pending=null;});
 return pending;
}

self.addEventListener('message',event=>{
 const port=event.ports?.[0],action=event.data?.type;
 if(!port||!['check-offline','save-offline'].includes(action))return;
 event.waitUntil((async()=>{
  try{
   if(action==='save-offline')await saveGame();
   const name=await availableCache();
   port.postMessage({saved:!!name,current:name===CACHE,version:name?.slice(CACHE_PREFIX.length)||null});
  }catch{port.postMessage({error:true});}
 })());
});

self.addEventListener('fetch',event=>{
 const {request}=event;
 if(request.method!=='GET')return;
 const url=new URL(request.url),kind=allowed.get(url.pathname);
 if(url.origin!==self.location.origin||!kind)return;
 const navigate=request.mode==='navigate';
 if(navigate&&kind!=='html'||!navigate&&kind==='html')return;
 event.respondWith((async()=>{
  try{
   const online=await fetch(request);
   if(online.status<500)return online;
   const saved=await availableCache();
   return saved&&(await (await caches.open(saved)).match(url.pathname))||online;
  }catch{
   const saved=await availableCache(),cached=saved&&(await (await caches.open(saved)).match(url.pathname));
   if(cached)return cached;
   if(navigate)return new Response('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>シカぼうの大冒険</title><h1>ゲームがまだ保存されていません</h1><p>通信をオンにし、ゲームを開いて「オフラインで遊ぶ」を押してください。</p></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
   return Response.error();
  }
 })());
});
