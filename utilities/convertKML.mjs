import { XMLParser } from "fast-xml-parser"
import fs from "node:fs"
import * as url from "url"
const __dirname = url.fileURLToPath(new URL(".", import.meta.url))

fs.readFile(
  `${__dirname}/Texas_eclipse_v2.3.kml`,
  "utf8",
  (err, xmlDataStr) => {
    if (err) {
      console.error(err)
      return
    }

    const options = {
      ignoreAttributes: false,
    }

    const parser = new XMLParser(options)
    try {
      let jsonObj = parser.parse(xmlDataStr)
      console.log(jsonObj)
      const myMap = {
        Folders: jsonObj.kml.Document.Folder,
        Placemark: jsonObj.kml.Document.Placemark,
      }
      fs.writeFile(
        `${__dirname}/Texas_eclipse_v2.3.json`,
        JSON.stringify(myMap, null, 2),
        (err) => {
          if (err) {
            console.error(err)
            return
          }
          console.log("File has been created")
        }
      )
    } catch (e) {
      console.error(e)
    }
  }
)
