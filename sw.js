// Guia offline. A página vem da rede quando há conexão (para pegar a versão nova)
// e do cache quando não há. Ícones, manifesto e fontes ficam em cache.
var CACHE='guia-v1';
var CASCA=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CASCA);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url);
  var fonte=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin && !fonte) return;
  if(r.mode==='navigate'){
    // rede primeiro; sem rede, a última versão guardada
    e.respondWith(fetch(r).then(function(resp){
      var copia=resp.clone(); caches.open(CACHE).then(function(c){c.put('index.html',copia);});
      return resp;
    }).catch(function(){return caches.match('index.html');}));
    return;
  }
  // demais arquivos: cache primeiro, atualizando por trás
  e.respondWith(caches.match(r).then(function(hit){
    var rede=fetch(r).then(function(resp){
      if(resp && (resp.ok || resp.type==='opaque')){ var copia=resp.clone(); caches.open(CACHE).then(function(c){c.put(r,copia);}); }
      return resp;
    }).catch(function(){return hit;});
    return hit || rede;
  }));
});
