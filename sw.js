/* 星轨绘卷 Service Worker —— 与 index.html 放在同一目录（GitHub Pages 等 HTTPS 环境）
   缓存名必须与 index.html 的 meta app-build / APP_BUILD 同步，发版时三处一起 +1 */
const CACHE='xinguihuajuan-v34';
const SHELL=['./','./index.html'];

self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  /* 逐个缓存，单个 URL 失败不影响安装，避免 404 让整个离线能力失效 */
  await Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})));
  await self.skipWaiting();
})())});

self.addEventListener('activate',e=>{e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()))});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  /* 版本检查 / 强制刷新必须走网络：ignoreSearch 会忽略查询串，否则 ?nc= 会命中旧缓存，导致永远查不到新版本 */
  if(e.request.cache==='no-store'||/[?&](nc|v)=/.test(u.search)){ e.respondWith(fetch(e.request)); return; }
  /* 同源 GET 缓存优先；离线时导航请求回退到已缓存的首页 */
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(resp=>{
    try{ const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); }catch(x){}
    return resp;
  }).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):new Response('',{status:503}))));
});
