// Keep the installable shell scoped to this garage, including on project-site hosts.
const prefix='truck-studio:'+new URL(self.registration.scope).pathname+':';
const cacheName=prefix+'2026-11-gallery-1';
const shell=['./','./vehicle.html','./viewer.css','./full-view.css','./garage.css','./studio-icon.svg','./app.webmanifest','./truck-preview.webp'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),base=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
  const file=url.pathname.slice(base.pathname.length);
  if(file.startsWith('api/')||file.startsWith('garage-models/')||file==='garage-catalog.json'||file.endsWith('.blend'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match(new URL(file==='vehicle.html'?'vehicle.html':'./',base).href)));
    return;
  }
  if(!/^(?:[\w.-]+\.(?:js|css|gz|hdr|json|woff2|webmanifest|webp|png|svg))$/.test(file))return;
  const immutable=/^(?:(?:lib|viewer|garage-vehicle)-[A-Z\d]+\.js|truck-[a-f\d]+\.gz)$/.test(file);
  event.respondWith((async()=>{
    const cache=await caches.open(cacheName);
    if(immutable){const match=await cache.match(request);if(match)return match;}
    try{
      const response=await fetch(request);
      if(response.ok){const copy=response.clone();event.waitUntil(cache.put(request,copy).catch(()=>{}));}
      return response;
    }catch(e){const match=await cache.match(request);if(match)return match;throw e;}
  })());
});
