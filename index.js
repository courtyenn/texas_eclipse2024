import { useSharePinModule } from "/sharePins.js"
const TAU = Math.PI * 2 // 360 degrees, but in radians
const DEG_45 = TAU / 8 // 45 degrees, but in radians

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
const DEFAULT_ICON = 28
const MAX_SMALL_ICON = 25
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

  mapEle.classList.remove("zoomed-out", "max-zoom-in")
  if (zoomLevel <= 16) mapEle.classList.add("zoomed-out")
  else if (zoomLevel === 18) mapEle.classList.add("max-zoom-in")
})

let myMarker = null
let myId = null
const myError = (e) => {
  // myMarker = L.marker([30.7968346, -98.3576996], {
  //   icon: L.divIcon({ className: "my-location-icon", iconSize: [20, 20] }),
  // }).addTo(map)
  throw e
}
const setMyLocation = (ev) => {
  const { latitude, longitude } = ev.coords
  if (!myMarker) {
    myMarker = L.marker([latitude, longitude], {
      icon: L.divIcon({ className: "my-location-icon" }),
    }).addTo(map)
  } else {
    myMarker.setLatLng([latitude, longitude])
    console.log("UPDATED LOCATION,", ev.latlng)
  }
}

navigator.geolocation.getCurrentPosition(setMyLocation, myError)
// myId = navigator.geolocation.watchPosition(setMyLocation, myError)

map.on("locationfound", setMyLocation)

L.tileLayer(`/assets/mapbox/{z}/{x}/{y}.png`, {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

const convertHslToColor = (hsl) => ({
  color: `hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`,
  weight: 4,
  fillOpacity: 0.2,
  opacity: 0.5,
})

const addPlacemark = (placemark, { hoverLabel, ...config }) => {
  const {
    icon,
    name,
    Point,
    Polygon,
    size: pmSize = DEFAULT_ICON,
    hoverLabel: pmHoverLabel,
  } = placemark
  const iconConfig = icon
    ? {
        icon: L.icon({
          iconUrl: `/assets/${icon}.png`,
          iconSize: [pmSize, pmSize],
          className: pmSize < MAX_SMALL_ICON ? "small-icon" : "",
        }),
      }
    : config
  if (Point) {
    const { coordinates } = Point
    const [longitude, latitude] = coordinates.split(",")
    L.marker([latitude, longitude], iconConfig)
      .addTo(map)
      .bindTooltip(name, {
        permanent: !hoverLabel && !pmHoverLabel,
        direction: "bottom",
        className: hoverLabel || pmHoverLabel ? "hovertip" : "tooltips",
      })
  } else if (Polygon) {
    const { coordinates } = Polygon.outerBoundaryIs.LinearRing
    const hueConfig = convertHslToColor(config.hsl)
    const latlngs = coordinates.split(" ").map((coord) => {
      const [longitude, latitude] = coord.split(",")
      return [latitude, longitude]
    })
    const poly = L.polygon(latlngs, hueConfig)
    if (icon !== "transparent_pixel" && icon) {
      const center = L.PolyUtil.polygonCenter(latlngs, CRS)
      L.marker(center, iconConfig).addTo(map)
      poly.addTo(map)
    }
    poly.addTo(map).bindPopup(name)
  } else {
    console.error("No point or polygon")
  }
}

const initializeFaye = () => {
  const toggleModal = (show) => {
    const modal = document.getElementById("spirit")
    if (show) {
      modal.showModal()
    } else {
      modal.close()
    }
  }
  document
    .getElementById("allGoodThings")
    .addEventListener("click", () => toggleModal(false))
  document
    .getElementById("faye")
    .addEventListener("click", () => toggleModal(true))
}

const createHub = ({ icon, Placemark }) => {
  const hubIcon = L.icon({
    iconUrl: `/assets/${icon}.png`,
    iconSize: [DEFAULT_ICON, DEFAULT_ICON],
    className: "satellite",
  })
  Placemark.forEach((pm) => {
    const name = pm.name
    const { coordinates } = pm.Point
    const [longitude, latitude] = coordinates.split(",")
    const [y, x] = [parseFloat(longitude), parseFloat(latitude)]
    L.marker([latitude, longitude], { icon: hubIcon })
      .addTo(map)
      .bindTooltip(name, {
        direction: "bottom",
        permanent: true,
        className: "tooltips satellite",
      })

    L.circle([latitude, longitude], {
      radius: 5,
      color: `#b3b3b3`,
      weight: 2,
      fillOpacity: 1,
      className: "hub_circle",
    }).addTo(map)

    const angles = [45, 90, 135, 225, 270, 315]
    const icons = [
      { icon: "droplet", size: 16, name: "Water" },
      { icon: "shower", size: 16, name: "Shower" },
      { icon: "restroom", size: 16, name: "Restroom" },
      { icon: "ambulance", size: 16, name: "First Aid" },
      { icon: "fuelpump", size: 16, name: "Fuel" },
      { icon: "store", size: 16, name: "General Store" },
    ]

    for (const [i, angle] of angles.entries()) {
      const radian = angle * DEG_45
      const legLength = 0.00019

      const nextX = x + Math.cos(radian) * legLength
      const nextY = y + Math.sin(radian) * legLength

      L.polyline(
        [
          [latitude, longitude],
          [nextX, nextY],
        ],
        {
          color: "#b3b3b3",
          weight: 2,
          className: "hub_leg",
        }
      ).addTo(map)

      L.marker([nextX, nextY], {
        icon: L.icon({
          iconUrl: `/assets/${icons[i].icon}.png`,
          iconSize: [14, 14],
          className: "hub_icon",
        }),
      })
        .addTo(map)
        .bindTooltip(icons[i].name, {
          className: "tooltips hub_label",
          permanent: true,
          direction: "bottom",
        })
        .openTooltip()
    }
  })
}
const createSmallIcons = ({ Placemark }) => {
  let iconNum = 10
  Placemark.forEach((pm) => {
    const div = document.createElement("div")
    const name = pm.name
    div.classList.add("custom-icons")
    div.classList.add(`icon-${iconNum}`)

    div.innerText = pm.name
      .split(" ")
      .map((name) => name[0])
      .join("")
    const { coordinates } = pm.Point
    const [longitude, latitude] = coordinates.split(",")
    L.marker([latitude, longitude], {
      icon: L.divIcon({ html: div, className: "test" }),
    })
      .addTo(map)
      .bindTooltip(name, {
        direction: "bottom",
        permanent: false,
        className: "small-icon",
      })
    iconNum += 10
    if (iconNum > 50) iconNum = 10
  })
}

const initializeNav = () => {
  const nav = document.createElement("nav")
  const link = document.createElement("a")
  link.href = "/schedules.html"
  link.textContent = "Lineup"
  link.classList.add("nav-link")
  nav.classList.add("nav")
  nav.appendChild(link)
  document.body.prepend(nav)
}

const TexasEclipse = (data) => {
  initializeFaye()
  initializeNav()
  const { Folders, Placemark } = data
  const { configureNewPinButton } = useSharePinModule(L, map)
  configureNewPinButton({ hideTooltipClass: "hide-tooltips" })
  const initialPlacemarkConfig = {
    hsl: { hue: 308, saturation: 100, lightness: 70 },
    icon: L.icon({
      iconUrl: "/assets/transparent_pixel.png",
      iconSize: [1, 1],
    }),
    hoverLabel: false,
  }
  for (const placemark of Placemark) {
    addPlacemark(placemark, initialPlacemarkConfig)
    if (Placemark[0].Polygon) {
      initialPlacemarkConfig.hsl.hue += 60
    }
  }
  initialPlacemarkConfig.hsl.hue = 178
  Folders.forEach((folder, i) => {
    const {
      icon,
      Placemark,
      hoverLabel = false,
      size = DEFAULT_ICON,
      name: folderName,
    } = folder
    const placemarkConfig = { ...initialPlacemarkConfig, hoverLabel, size }

    if (folderName === "Hubs") {
      createHub({ icon, Placemark })
    } else if (folderName === "Small_Icons") {
      createSmallIcons({ Placemark })
    } else {
      if (icon) {
        placemarkConfig.icon = L.icon({
          iconUrl: `/assets/${icon}.png`,
          iconSize: [size, size],
          className: size < MAX_SMALL_ICON ? "small-icon" : "",
        })
      }

      if (Array.isArray(Placemark)) {
        Placemark.forEach((pm) => addPlacemark(pm, placemarkConfig))
      } else {
        addPlacemark(Placemark, placemarkConfig)
      }
    }
    initialPlacemarkConfig.hsl.hue += 65
  })
}

fetch("./utilities/Texas_eclipse_v2.9.json")
  .then((response) => response.json())
  .then(TexasEclipse)
