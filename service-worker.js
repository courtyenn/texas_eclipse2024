const CACHE_NAME = "cache-v1"
const registerWorker = async () => {
  // List the files to precache
  const precacheResources = [
    "/",
    "/index.html",
    "/index.js",
    "/sharePins.js",
    "/utilities/Texas_eclipse_v1.4.json",
    "/assets",
  ]

  // When the service worker is installing, open the cache and add the precache resources to it
  self.addEventListener("install", (event) => {
    console.log("Service worker install event!")
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(precacheResources))
    )
  })

  self.addEventListener("activate", (event) => {
    console.log("Service worker activate event!")
  })

  // When there's an incoming fetch request, try and respond with a precached resource, otherwise fall back to the network
  self.addEventListener("fetch", async (e) => {
    e.respondWith(
      (async function () {
        const cachedResponse = await caches.match(e.request)
        if (cachedResponse) {
          return cachedResponse
        }

        const networkResponse = await fetch(e.request)

        const hosts = [
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
          "https://api.mapbox.com",
        ]

        if (hosts.some((host) => e.request.url.startsWith(host))) {
          // This clone() happens before `return networkResponse`
          const clonedResponse = networkResponse.clone()

          e.waitUntil(
            (async function () {
              const cache = await caches.open(CACHE_NAME)
              // This will be called after `return networkResponse`
              // so make sure you already have the clone!
              await cache.put(e.request, clonedResponse)
            })()
          )
        }

        return networkResponse
        // console.log("Fetch intercepted for:", event.request.url)
        // event.respondWith(
        //   caches.match(event.request).then((cachedResponse) => {
        //     if (cachedResponse) {
        //       return cachedResponse
        //     }
        //     return fetch(event.request)
        //   })
        // )
      })()
    )
  })
}

registerWorker()