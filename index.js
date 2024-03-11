const MAX_BOUNDS = [
  [30.863045, -98.421356],
  [30.722219, -98.181716],
]
const START = [30.796385, -98.359466]
const map = L.map("map", {
  maxBounds: MAX_BOUNDS,
}).setView(START, 14)
map.fitBounds(FIT_BOUNDS)
L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)

const convertHslToColor = (hsl) => ({
  color: `hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`,
  weight: 4,
  fillOpacity: 0.5,
})

const addPlacemarks = (Placemark, { hsl }) => {
  Placemark.forEach((placemark) => {
    const { name, Point, Polygon } = placemark
    const placemarkConfig = convertHslToColor(hsl)
    if (Point) {
      const { coordinates } = Point
      const [longitude, latitude] = coordinates.split(",")
      L.marker([latitude, longitude])
        .addTo(map)
        .bindTooltip(name, {
          permanent: true,
          direction: "bottom",
        })
        .openTooltip()
      // L.tooltip([latitude, longitude], { content: `<h2>${name}</h2>` }).addTo(
      //   map
      // )
    } else if (Polygon) {
      const { coordinates } = Polygon.outerBoundaryIs.LinearRing
      const latlngs = coordinates.split(" ").map((coord) => {
        const [longitude, latitude] = coord.split(",")
        return [latitude, longitude]
      })
      L.polygon(latlngs, placemarkConfig).addTo(map).bindPopup(name)
    } else {
      console.log("No point or polygon")
    }
  })
}
const TexasEclipse = (data) => {
  const { Folders, Placemark } = data
  console.log(Folders, Placemark)
  let placemarkConfig = { hsl: { hue: 0, saturation: 100, lightness: 90 } }
  for (const folder of Folders) {
    const { name, Placemark } = folder
    console.log(name)
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
