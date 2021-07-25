import { Control } from 'ol/control'
import { shiftKeyOnly, singleClick } from 'ol/events/condition'

export function deleteCondition (event) {
  return shiftKeyOnly(event) &&
    singleClick(event)
}

export class TileLayerControl extends Control {
  tileSources = [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
      icon: 'satellite'
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      icon: 'map'
    }
  ]

  tileSourceIndex = 0

  constructor (options) {
    options = options || {}

    const button = document.createElement('button')

    const element = document.createElement('div')
    element.className = 'tile-layer-control ol-unselectable ol-control'
    element.appendChild(button)

    super({
      element: element,
      target: options.target
    })

    this.button = button
    this.tileLayer = options.tileLayer
    this.tileSource = this.tileLayer.getSource()

    this.updateTileSourceUrl()

    button.addEventListener('click', this.handleClick.bind(this), false)
  }

  updateTileSourceUrl () {
    const tileSource = this.tileSources[this.tileSourceIndex]
    this.tileSource.setUrl(tileSource.url)
    this.button.innerHTML = `<span class="icon is-small"><i class="fas fa-${tileSource.icon}"></i></span>`
  }

  handleClick () {
    this.tileSourceIndex = (this.tileSourceIndex + 1) % 2
    this.updateTileSourceUrl()
  }
}
