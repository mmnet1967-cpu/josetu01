// 除雪支援システム サービスワーカー：アプリ本体を端末に保存し、通信がなくても起動できるようにする
const APP='josetsu-app-v2', FONTS='josetsu-fonts';
const CORE=['./','./index.html','./manifest.webmanifest','./lib/leaflet.css','./lib/leaflet.js','./lib/three.min.js',
  './lib/images/layers.png','./lib/images/layers-2x.png','./lib/images/marker-icon.png','./lib/images/marker-icon-2x.png','./lib/images/marker-shadow.png',
  './icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==APP&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
  if(u.origin===location.origin){
    if(req.mode==='navigate'){   // 画面本体：通信できれば最新版、だめなら保存版
      e.respondWith((async()=>{try{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),4000);const r=await fetch(req,{signal:ac.signal});clearTimeout(t);
        if(r.ok){const c=await caches.open(APP);c.put('./index.html',r.clone());}return r;}
        catch(err){return (await caches.match('./index.html'))||(await caches.match('./'));}})());return;}
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(APP).then(c=>c.put(req,cp));}return r;})));return;}
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(async c=>{const hit=await c.match(req);
      const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r;}).catch(()=>hit||Response.error());return hit||net;}));}
  // 地理院タイルは画面側で端末内保存（IndexedDB）から読み込むため、ここでは扱わない
});
