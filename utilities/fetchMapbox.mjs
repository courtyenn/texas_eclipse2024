import { calcSlippyTiles } from "./tilemaps.mjs"
import fs from "node:fs"
import { opendir } from "node:fs/promises"
import * as url from "url"
const __dirname = url.fileURLToPath(new URL("..", import.meta.url))

const permutations = calcSlippyTiles()

for (let i = 0; i < permutations.length; i++) {
  try {
    const { zoom, x, y, url } = permutations[i]
    try {
      await opendir(`${__dirname}assets/mapbox/${zoom}/${x}`)
    } catch (e) {
      fs.mkdir(
        `${__dirname}assets/mapbox/${zoom}/${x}`,
        { recursive: true },
        (err) => {
          if (err) {
            console.error(err)
          }
        }
      )
    }
    const response = await fetch(url)
    const imageBlob = await response.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.createWriteStream(
      `${__dirname}assets/mapbox/${zoom}/${x}/${y}.png`
    ).write(buffer)
  } catch (e) {
    console.error(e)
  }
}
