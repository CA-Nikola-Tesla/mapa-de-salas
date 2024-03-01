// based on: https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e

var URL_PATH = self.location.pathname.replace(/[^/]*$/, '')

var APP_PREFIX = 'MapaDeSalas_'         // Identifier for this app (this needs to be consistent across every cache update)
var VERSION = 'version_02'              // Version of the off-line cache (change this value everytime you want to update cache)
var CACHE_NAME = APP_PREFIX + VERSION
var URLS = [                            // Add URL you want to cache in this list.
	URL_PATH,
	URL_PATH + 'mapa.html',
	URL_PATH + 'script.js',
	URL_PATH + 'table.js',
	URL_PATH + 'style.css',
	URL_PATH + 'tabela.json',
	URL_PATH + 'ifsp.svg'
]

// Respond with cached resources
self.addEventListener('fetch', function (e) {
  console.log('fetch request : ' + e.request.url)
  e.respondWith(
    fetch(e.request).then(function(res) {
      console.log('returning online');
      return caches.open(CACHE_NAME).then(function(cache) {
        cache.put(e.request.url, res.clone());
        return res;
      });
    }).catch(function(err) {
      console.log('returning cached');
      return caches.match(e.request);
    })
  );
})

// Cache resources
self.addEventListener('install', function (e) {
  console.log(self.location);
  console.log(e);
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('installing cache : ' + CACHE_NAME)
      return cache.addAll(URLS)
    })
  )
})

// Delete outdated caches
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      // `keyList` contains all cache names under your username.github.io
      // filter out ones that has this app prefix to create white list
      var cacheWhitelist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX)
      })
      // add current cache name to white list
      cacheWhitelist.push(CACHE_NAME)

      return Promise.all(keyList.map(function (key, i) {
        if (cacheWhitelist.indexOf(key) === -1) {
          console.log('deleting cache : ' + keyList[i] )
          return caches.delete(keyList[i])
        }
      }))
    })
  )
})
