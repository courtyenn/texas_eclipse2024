const PIN_WIDTH = 30
const PIN_HEIGHT = 30

const pinStyles = {
  width: `${PIN_WIDTH}px`,
  transform: `translate(-${PIN_WIDTH / 3}px, -${
    PIN_HEIGHT / 2
  }px) rotate(30deg)`,
  display: "block",
}
const markerStyles = ({ width, height }) => ({
  position: "absolute",
  top: `${height / 2}px`,
  left: `${width / 2}px`,
  zIndex: 999,
  padding: "0 0 0 4px",
})

const buttonStyles = {
  border: "none",
  fontSize: "1rem",
  background: "white",
  padding: "5px 14px",
}

const containerStyles = {
  display: "flex",
  gap: "8px",
  position: "relative",
  left: "5px",
  top: "10px",
  margin: "8px 0 6px",
}

const inputStyles = {
  width: "150px",
  fontSize: "16px",
  marginTop: 0,
  position: "absolute",
  top: "15px",
  left: "8px",
}

const applyStyles = (element, styles) => {
  for (const style in styles) {
    element.style[style] = styles[style]
  }
}

export const useSharePinModule = (L, map, mapEle) => {
  const createPinButton = document.getElementById("create-pin")
  const sharePin = document.getElementById("share-pins")
  const leafletControl = document.querySelector(".leaflet-control")
  document.body.removeChild(createPinButton)
  document.body.removeChild(sharePin)
  leafletControl.appendChild(createPinButton)
  leafletControl.appendChild(sharePin)

  // const sharePins = () => {
  //   document.addEventListener("click", (e) => {
  //     const latlng = map.mouseEventToLatLng(e)
  //     console.log("click", latlng)
  //   })
  // }

  const createPin = ({ latlng, name }) => {
    const iconConfig = {
      icon: L.icon({
        iconUrl: `/assets/pin.png`,
        iconSize: [34, 34],
      }),
    }
    L.marker(latlng, iconConfig)
      .addTo(map)
      .bindTooltip(name, {
        direction: "bottom",
        permanent: true,
        className: "tooltips",
      })
      .openTooltip()
  }

  const configureNewPinButton = ({ hideTooltipClass }) => {
    const setMarkerPinOnMap = () => {
      const { width, height } = mapEle.getBoundingClientRect()
      const marker = document.createElement("form")
      const pinImg = document.createElement("img")
      const input = document.createElement("input")
      const btnContainer = document.createElement("div")
      const confirm = document.createElement("button")
      const cancel = document.createElement("button")

      marker.id = "new-marker"
      pinImg.src = "/assets/pin.png"
      input.type = "text"
      input.maxLength = 30
      input.required = true
      input.value = "New Pin"
      input.classList.add("tooltips")
      confirm.type = "submit"
      confirm.innerText = "Confirm"
      cancel.innerText = "Cancel"
      cancel.type = "button"

      applyStyles(pinImg, pinStyles)
      applyStyles(confirm, {
        ...buttonStyles,
        background: "green",
        color: "white",
      })
      applyStyles(cancel, { ...buttonStyles })
      applyStyles(btnContainer, containerStyles)
      applyStyles(input, inputStyles)
      applyStyles(marker, markerStyles({ width, height }))

      marker.appendChild(pinImg)
      marker.appendChild(input)
      btnContainer.appendChild(confirm)
      btnContainer.appendChild(cancel)
      marker.appendChild(btnContainer)
      document.body.appendChild(marker)
      input.focus()

      return { marker, confirm, cancel, input }
    }
    const trackMarker = () => {
      const { marker, confirm, cancel, input } = setMarkerPinOnMap()
      const { x, y } = marker.getBoundingClientRect()

      const eventHandler = (eles, eventName, callback) => {
        eles.forEach((ele) =>
          ele.addEventListener(eventName, (e) => {
            if (input.value.length > 0) {
              eles.forEach((el) => {
                el.removeEventListener(eventName, callback)
              })
              callback(e.target.type === "submit")
            }
          })
        )
      }
      eventHandler([confirm, cancel], "click", (confirmed) => {
        document.body.removeChild(marker)
        const { lat, lng } = map.containerPointToLatLng([x, y])
        confirmed &&
          createPin({
            latlng: [lat, lng],
            name: input.value,
          })
        map.getContainer().classList.remove(hideTooltipClass)
      })

      mapEle.classList.add(hideTooltipClass)
      map.setZoom(18)
    }
    createPinButton.addEventListener("click", trackMarker)
  }

  return { configureNewPinButton }
}
