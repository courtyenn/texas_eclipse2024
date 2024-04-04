export function getTileNumber(lat_deg, lon_deg, zoomLevel) {
  const lat_rad = (lat_deg * Math.PI) / 180
  const n = Math.pow(2, zoomLevel)
  const xtile = n * ((lon_deg + 180) / 360)
  const ytile =
    (n * (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) /
    2

  return { xtile: Math.floor(xtile), ytile: Math.floor(ytile) }
}

function generatePermutations(startIndex, endIndex, zoom) {
  const permutations = []

  for (let i = startIndex[0]; i <= endIndex[0]; i++) {
    for (let j = startIndex[1]; j <= endIndex[1]; j++) {
      permutations.push(
        `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${i}/${j}.png?access_token=pk.eyJ1IjoiY291cnR5ZW4iLCJhIjoiY2x0bXR5bnNzMXM3dTJscGF3NG9kYW1kcCJ9.EikiYGKRyBhxnNBCtWU2sA`
      )
    }
  }

  return permutations
}

function generatePermutationObjects(startIndex, endIndex, zoom) {
  const permutations = []

  for (let i = startIndex[0]; i <= endIndex[0]; i++) {
    for (let j = startIndex[1]; j <= endIndex[1]; j++) {
      permutations.push({
        url: `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${i}/${j}.png?access_token=pk.eyJ1IjoiY291cnR5ZW4iLCJhIjoiY2x0bXR5bnNzMXM3dTJscGF3NG9kYW1kcCJ9.EikiYGKRyBhxnNBCtWU2sA`,
        zoom,
        x: i,
        y: j,
      })
    }
  }

  return permutations
}

export const calcSlippyTiles = () => {
  const boundaryMap = {
    18: [
      { xtile: 59442, ytile: 107468 },
      { xtile: 59463, ytile: 107493 },
    ],
    17: [
      { xtile: 29718, ytile: 53731 },
      { xtile: 29735, ytile: 53747 },
    ],
    16: [
      { xtile: 14857, ytile: 26863 },
      { xtile: 14866, ytile: 26873 },
    ],
    15: [
      { lat: 30.81244429602014, lng: -98.36879253387453 }, // NW
      { lat: 30.779045339293187, lng: -98.32961082458496 }, // SE
    ],
  }
  const zoomLevels = [15, 16, 17, 18]
  let permutations = [],
    xtile,
    ytile,
    xtile2,
    ytile2
  zoomLevels.forEach((zoomLevel) => {
    if (!boundaryMap[zoomLevel][0].xtile) {
      const tiles = getTileNumber(
        boundaryMap[zoomLevel][0].lat,
        boundaryMap[zoomLevel][0].lng,
        zoomLevel
      )
      xtile = tiles.xtile
      ytile = tiles.ytile
      const tiles2 = getTileNumber(
        boundaryMap[zoomLevel][1].lat,
        boundaryMap[zoomLevel][1].lng,
        zoomLevel
      )
      xtile2 = tiles2.xtile
      ytile2 = tiles2.ytile
    } else {
      xtile = boundaryMap[zoomLevel][0].xtile
      xtile2 = boundaryMap[zoomLevel][1].xtile
      ytile = boundaryMap[zoomLevel][0].ytile
      ytile2 = boundaryMap[zoomLevel][1].ytile
    }
    permutations = permutations.concat(
      generatePermutationObjects([xtile, ytile], [xtile2, ytile2], zoomLevel)
    )
    // console.log(`current permutations: ${permutations.length}`)
    // console.log(
    //   `# of permutations at zoom level ${zoomLevel}: ${xtile2 - xtile} * ${
    //     ytile2 - ytile
    //   } = ${(xtile2 - xtile) * (ytile2 - ytile)}`
    // )
  })

  // console.log("total permutations:", permutations)
  return permutations
}
