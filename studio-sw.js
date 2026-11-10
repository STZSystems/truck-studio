// Keep the installable shell scoped to this garage, including on project-site hosts.
const prefix='truck-studio:'+new URL(self.registration.scope).pathname+':';
// Choreography releases reuse the hashed truck model already on the phone.
const cacheName=prefix+'2026-11-gallery-1';
const shell=['./','./vehicle.html','./viewer.css','./full-view.css','./garage.css','./studio-icon.svg','./app.webmanifest','./truck-preview.webp'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(cacheName);
    const fresh=shell.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'}));
    await cache.addAll(fresh);
    await self.skipWaiting();
  })());
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
    if(file!=='' && file!=='index.html' && file!=='vehicle.html')return;
    const shellKey=new URL(file==='vehicle.html'?'vehicle.html':'./',base).href;
    event.respondWith((async()=>{
      const cache=await caches.open(cacheName);
      try{
        // Pages gives HTML a ten-minute HTTP cache. Revalidate the shell so a
        // returning visitor picks up the current viewer bundle on navigation.
        const response=await fetch(request,{cache:'no-cache'});
        if(response.ok){
          const copy=response.clone();event.waitUntil(cache.put(shellKey,copy).catch(()=>{}));
        }
        return response;
      }catch(error){const saved=await cache.match(shellKey);if(saved)return saved;throw error;}
    })());
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
