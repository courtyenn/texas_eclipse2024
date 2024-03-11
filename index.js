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
  zoom: 14,
})
map.fitBounds(FIT_BOUNDS)
map.on("zoomstart", function () {
  const zoomLevel = map.getZoom()
  const tooltips = document.getElementsByClassName("tooltips")

  for (const tooltip of tooltips) {
    tooltip.style.fontSize = `${zoomLevel * 2 - 14}px`
  }
})
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

const addPlacemarks = (Placemark, { hsl, icon }) => {
  Placemark.forEach((placemark) => {
    const { name, Point, Polygon } = placemark
    const placemarkConfig = convertHslToColor(hsl)
    if (Point) {
      const { coordinates } = Point
      const [longitude, latitude] = coordinates.split(",")
      L.marker([latitude, longitude], {
        icon,
      })
        .addTo(map)
        .bindTooltip(name, {
          permanent: true,
          direction: "bottom",
          className: "tooltips",
        })
        .openTooltip()
    } else if (Polygon) {
      const { coordinates } = Polygon.outerBoundaryIs.LinearRing
      const latlngs = coordinates.split(" ").map((coord) => {
        const [longitude, latitude] = coord.split(",")
        return [latitude, longitude]
      })
      const poly = L.polygon(latlngs, placemarkConfig)
      const center = L.PolyUtil.polygonCenter(latlngs, CRS)
      L.tooltip(center, {
        permanent: true,
        direction: "bottom",
        className: "boundary_label",
        content: name,
      }).addTo(map)
      poly.addTo(map).bindPopup(name)
    } else {
      console.log("No point or polygon")
    }
  })
}
const TexasEclipse = (data) => {
  const { Folders, Placemark } = data
  let placemarkConfig = { hsl: { hue: 0, saturation: 100, lightness: 90 } }
  for (const folder of Folders) {
    const { name, icon, Placemark } = folder

    if (icon) {
      placemarkConfig.icon = L.icon({
        iconUrl: `/assets/${icon}.png`,
        iconSize: [34, 34],
      })
    }
    if (Array.isArray(Placemark)) {
      addPlacemarks(Placemark, placemarkConfig)
    } else {
      addPlacemarks([Placemark], placemarkConfig)
    }
    placemarkConfig.hsl.hue += 60
  }
  for (const placemark of Placemark) {
    addPlacemarks([placemark], placemarkConfig)
  }
}

fetch("./utilities/Texas_eclipse_v1.4.json")
  .then((response) => response.json())
  .then(TexasEclipse)
