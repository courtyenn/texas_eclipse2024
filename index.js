import { useSharePinModule } from "/sharePins.js"

// // // Register the service worker
if ("serviceWorker" in navigator) {
  let reg
  // Wait for the 'load' event to not block other work
  window.addEventListener("load", async () => {
    // Try to register the service worker.
    // Capture the registration for later use, if needed

    reg = await navigator.serviceWorker.register("/service-worker.js", {
      type: "module",
    })
  })
}

const MAX_BOUNDS = [
  [30.863045, -98.421356],
  [30.722219, -98.181716],
]
const FIT_BOUNDS = [
  [30.79844, -98.361284],
  [30.7907, -98.34513],
]
const CRS = L.CRS.EPSG3857
const map = L.map("map", {
  maxBounds: MAX_BOUNDS,
  zoom: 15,
  minZoom: 15,
  maxZoom: 18,
})
map.fitBounds(FIT_BOUNDS)
map.on("zoomend", function () {
  const zoomLevel = map.getZoom()
  console.log("zoom", zoomLevel)
  const mapEle = document.getElementById("map")

  mapEle.classList.remove("zoomed-out")
  if (zoomLevel <= 16) mapEle.classList.add("zoomed-out")
})
// document.body.addEventListener("click", (e) => {
//   const { lat, lng } = map.mouseEventToLatLng(e)
//   const zoom = map.getZoom()
//   const { xtile, ytile } = getTileNumber(lat, lng, zoom)
//   console.log(
//     `lat: ${lat}, lng: ${lng}, zoom: ${zoom}, getTileNumber: ${xtile}, ${ytile} `
//   )
// })
L.tileLayer(
  `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY291cnR5ZW4iLCJhIjoiY2x0bXR5bnNzMXM3dTJscGF3NG9kYW1kcCJ9.EikiYGKRyBhxnNBCtWU2sA`,
  {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
).addTo(map)

const convertHslToColor = (hsl) => ({
  color: `hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`,
  weight: 4,
  fillOpacity: 0.5,
})

const addPlacemark = (placemark, { hoverLabel, ...config }) => {
  const { icon, name, Point, Polygon } = placemark
  const iconConfig = icon
    ? {
        icon: L.icon({
          iconUrl: `/assets/${icon}.png`,
          iconSize: [34, 34],
        }),
      }
    : config
  if (Point) {
    const { coordinates } = Point
    const [longitude, latitude] = coordinates.split(",")
    L.marker([latitude, longitude], iconConfig)
      .addTo(map)
      .bindTooltip(name, {
        permanent: !hoverLabel,
        direction: "bottom",
        className: hoverLabel ? "" : "tooltips",
      })
      .openTooltip()
  } else if (Polygon) {
    const { coordinates } = Polygon.outerBoundaryIs.LinearRing
    const hueConfig = convertHslToColor(config.hsl)
    const latlngs = coordinates.split(" ").map((coord) => {
      const [longitude, latitude] = coord.split(",")
      return [latitude, longitude]
    })
    const poly = L.polygon(latlngs, hueConfig)
    const center = L.PolyUtil.polygonCenter(latlngs, CRS)
    L.marker(center, iconConfig)
      .addTo(map)
      .bindTooltip(name, {
        direction: "bottom",
        permanent: !hoverLabel,
        className: hoverLabel ? "" : !!icon ? "tooltips" : "area_label",
      })
    poly.addTo(map)
  } else {
    console.error("No point or polygon")
  }
}

const TexasEclipse = (data) => {
  const { Folders, Placemark } = data
  const { configureNewPinButton } = useSharePinModule(L, map)
  configureNewPinButton({ hideTooltipClass: "hide-tooltips" })
  const initialPlacemarkConfig = {
    hsl: { hue: 0, saturation: 100, lightness: 70 },
    icon: L.icon({
      iconUrl: "/assets/transparent_pixel.png",
      iconSize: [1, 1],
    }),
    hoverLabel: false,
  }
  for (const folder of Folders) {
    const { icon, Placemark, hoverLabel = false } = folder
    const placemarkConfig = { ...initialPlacemarkConfig, hoverLabel }

    if (icon) {
      placemarkConfig.icon = L.icon({
        iconUrl: `/assets/${icon}.png`,
        iconSize: [34, 34],
      })
      placemarkConfig.iconName = icon
    }
    if (Array.isArray(Placemark)) {
      Placemark.forEach((pm) => addPlacemark(pm, placemarkConfig))
    } else {
      addPlacemark(Placemark, placemarkConfig)
    }
    initialPlacemarkConfig.hsl.hue += 60
  }
  initialPlacemarkConfig.hsl.hue = 30
  for (const placemark of Placemark) {
    addPlacemark(placemark, initialPlacemarkConfig)
    initialPlacemarkConfig.hsl.hue += 60
  }
}

fetch("./utilities/Texas_eclipse_v1.4.json")
  .then((response) => response.json())
  .then(TexasEclipse)
