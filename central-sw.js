const CACHE='forte-central-20261004-3';
const STATIC=["/sistemas.html","/central.css?v=20261004-3","/central/loader.js?v=20261004-3","/central/main.js?v=20261004-3","/central.webmanifest","/central/icons/vendas-aprovado-320.png","/central/icons/financeiro-aprovado-320.png","/central/icons/fiscal-aprovado-320.png","/central/icons/frete-aprovado-320.png","/central/icons/venda-externa-aprovado-320.png","/central/icons/carga-direta-aprovado-320.png","/central/icons/patio-aprovado-320.png","/central/icons/site-aprovado-320.png","/central/icons/central-aprovada-48.png","/central/icons/central-aprovada-180.png","/central/icons/central-aprovada-192.png","/central/icons/central-aprovada-512.png"];
const paths=new Set(STATIC.map(path=>new URL(path,self.location.origin).pathname));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('forte-central-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!paths.has(url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}
    return response;
  }).catch(async()=>{const cache=await caches.open(CACHE),cached=await cache.match(event.request,{ignoreSearch:true});return cached||new Response('A Central precisa de conexão com a internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}));
});
