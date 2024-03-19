import { calcSlippyTiles } from "/tilemaps.js"
const ICONS = [
  "ambulance",
  "arrow_right",
  "art",
  "blue_pin",
  "car",
  "cherry_blossom",
  "door",
  "hammer_and_pick",
  "key",
  "pin",
  "pizza",
  "potable_water",
  "shopping_bags",
  "shower",
  "star",
  "tent",
  "transparent_pixel",
  "tree",
]
const CACHE_NAME = "cache-v1"

const registerWorker = async () => {
  // List the files to precache
  const precacheResources = [
    "/",
    "/index.html",
    "/index.js",
    "/sharePins.js",
    "/tilemaps.js",
    "/utilities/Texas_eclipse_v1.4.json",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    ...ICONS.map((icon) => `/assets/${icon}.png`),
  ]

  // When the service worker is installing, open the cache and add the precache resources to it
  self.addEventListener("install", (event) => {
    event.waitUntil(
      Promise.all([
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.addAll(calcSlippyTiles())),
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.addAll(precacheResources)),
      ])
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

        try {
          const networkResponse = await fetch(e.request)

          const hosts = ["/assets"]

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
        } catch (error) {
          console.error("Fetch failed; returning offline page instead.", error)
        }
      })()
    )
  })
}

registerWorker()
