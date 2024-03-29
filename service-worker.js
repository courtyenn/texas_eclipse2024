import { calcSlippyTiles } from "/utilities/tilemaps.mjs"
const ICONS = [
  "ambulance",
  "arrow_right",
  "art",
  "baby_symbol",
  "black_star",
  "blue_pin",
  "car",
  "carrot",
  "cherry_blossom",
  "door",
  "droplet",
  "fuelpump",
  "hammer_and_pick",
  "key",
  "minibus",
  "native",
  "no_entry",
  "oncoming_bus",
  "pin",
  "pink_star",
  "pizza",
  "purple_heart",
  "restroom",
  "satellite",
  "shopping_bags",
  "shower",
  "sleeping",
  "star",
  "store",
  "swim",
  "telescope",
  "tent",
  "transparent_pixel",
  "tree",
  "unicorn_face",
  "wheelchair",
  "sun_stage",
  "sky_stage",
  "moon_stage",
  "eclipse_stage",
  "lonestar_stage",
  "earth_stage",
]
const CACHE_NAME = "cache-v3"

const registerWorker = async () => {
  // List the files to precache
  const precacheResources = [
    "/",
    "/index.html",
    "/schedules.html",
    "/my-schedule.html",
    "/index.js",
    "/sharePins.js",
    "/utilities/Texas_eclipse_v2.6.json",
    "/utilities/events.json",
    "/assets/solar-eclipse.png",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "https://unpkg.com/vue@3/dist/vue.esm-browser.js",
    "https://unpkg.com/vue-multiselect@3.0.0-beta.3/dist/vue-multiselect.esm.css",
    "https://unpkg.com/vue-multiselect@3.0.0-beta.3/dist/vue-multiselect.esm.js",
    "https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css",
    ...ICONS.map((icon) => `/assets/${icon}.png`),
    ...calcSlippyTiles().map(
      (tile) => `/assets/mapbox/${tile.zoom}/${tile.x}/${tile.y}.png`
    ),
  ]

  // When the service worker is installing, open the cache and add the precache resources to it
  self.addEventListener("install", (event) => {
    event.waitUntil(
      Promise.all([
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
      caches.open(CACHE_NAME).then(async (cache) => {
        const hosts = [
          "http://localhost:8080",
          "https://texas-eclipse2024.vercel.app",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ]
        if (hosts.some((host) => e.request.url.startsWith(host))) {
          // This clone() happens before `return networkResponse`
          try {
            const networkResponse = await fetch(e.request)
            const clonedResponse = networkResponse.clone()

            e.waitUntil(async function () {
              const cache = await caches.open(CACHE_NAME)
              // This will be called after `return networkResponse`
              // so make sure you already have the clone!
              return await cache.put(e.request, clonedResponse)
            })

            return networkResponse
          } catch (err) {
            return cache.match(e.request)
          }
        }
      })
    )
  })
}

registerWorker()
