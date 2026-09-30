/* Cuaderno Profesor · service worker
   La app se carga de la red si hay conexión (así llegan las actualizaciones)
   y de la copia guardada si no la hay. Las llamadas a Google no se tocan. */
const CACHE = 'cuaderno-v3.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);
  if(url.origin===location.origin){
    e.respondWith(
      fetch(req).then(res=>{
        if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); }
        return res;
      }).catch(()=>caches.match(req).then(r=>r || (req.mode==='navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }
  if(url.hostname==='fonts.googleapis.com' || url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(r=>r || fetch(req).then(res=>{
      const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res;
    })));
  }
});
