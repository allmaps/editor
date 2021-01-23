<template>
  <div id="map" class="map"></div>
</template>

<script>
import Map from 'ol/Map'
import Feature from 'ol/Feature'
import View from 'ol/View'
import {Layer, Tile as TileLayer, Vector as VectorLayer, Image} from 'ol/layer'
import {Point, Polygon} from 'ol/geom'
import {OSM, Vector as VectorSource, ImageCanvas} from 'ol/source'
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style'
import {GeoJSON} from 'ol/format'
import {fromLonLat, toLonLat, transformExtent} from 'ol/proj'
import {compose, create} from 'ol/transform'
import {createTransformString} from 'ol/render/canvas'
import {round} from '@lib/functions'
import {deleteCondition} from '@lib/openlayers'
import {getIiifTiles} from '@lib/tiles'

import WarpedMapLayer from '@lib/warped-map-layer'


export default {
  name: 'Results',
  props: {
    bus: Object,
    maps: Object,
    images: Object,
    showAnnotation: Boolean,
    selectedImageId: String,
    selectedMapId: String
  },
  data () {
    return {
      mapOl: undefined,
      mapSource: undefined,
      mapLayer: undefined,
      mapVector: undefined,
      warpedIiifLayers: {},
      warpedMapVisible: true,

      dimensions: undefined
    }
  },
  watch: {
    showAnnotation: function () {
      window.setTimeout(this.onResize, 100)
    },
    images: function () {
      this.update()
    },
    maps: function () {
      this.update()
    }
  },
  methods: {
    keyDown: function (event) {
      if (event.code === 'Space') {
        this.toggleWarpedMap(false)
      }
    },
    keyUp: function (event) {
      if (event.code === 'Space') {
        this.toggleWarpedMap(true)
      }
    },
    toggleWarpedMap: function (visible) {
      if (visible !== this.warpedMapVisible) {
        Object.values(this.warpedIiifLayers).forEach((warpedIiifLayer) => {
          warpedIiifLayer.setVisible(visible)
        })

        this.warpedMapVisible = visible
      }
    },
    onResize: function () {
      if (this.mapOl) {
        this.mapOl.updateSize()
      }
    },
    update: function () {
      this.mapSource.clear()

      const geoMasks = Object.values(this.maps)
        .filter((map) => map.geoMask)
        .map((map) => map.geoMask)

      geoMasks.forEach((geoMask) => {
        this.mapSource.addFeature((new GeoJSON()).readFeature(geoMask, { featureProjection: 'EPSG:3857' }))
      })

      if (geoMasks.length) {
        const extent = this.mapSource.getExtent()
        this.mapOl.getView().fit(extent, {
          padding: [25, 25, 25, 25],
          maxZoom: 18
        })
      }

      Object.values(this.maps).forEach((map) => {
        if (!this.warpedIiifLayers[map.id]) {
          const image = this.images[map.imageId]

          const warpedIiifLayer = new WarpedMapLayer({
            warpedMap: map,
            image,
            source: this.mapSource
          })

          this.mapOl.addLayer(warpedIiifLayer)

          this.warpedIiifLayers[map.id] = warpedIiifLayer
        } else {
          // TODO: update!
          // if (this.warpedIiifLayer && image && map) {
          //   this.warpedIiifLayer.update(image, map)
          // }
        }
      })

      // TODO: remove old maps!
    }
  },
  mounted: function () {
    this.mapLayer = new TileLayer({
      source: new OSM()
    })
    this.mapSource = new VectorSource()

    this.mapVector = new VectorLayer({
      source: this.mapSource,
      style: new Style({
        stroke: new Stroke({
          color: '#E10800',
          width: 3
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#E10800'
          })
        })
      })
    })

    let map
    let image
    if (Object.keys(this.maps).length) {
      map = Object.values(this.maps)[0]
      image = this.images[map.imageId]
    }

    this.mapOl = new Map({
      layers: [this.mapLayer, this.mapVector],
      target: 'map',
      view: new View({
        center: fromLonLat([-77.036667, 38.895]),
        zoom: 3
      })
    })

    this.update()

    window.addEventListener('keydown', this.keyDown)
    window.addEventListener('keyup', this.keyUp)
  },
  beforeDestroy: function () {
    Object.values(this.warpedIiifLayers).forEach((warpedIiifLayer) => {
      warpedIiifLayer.destroy()
    })

    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
  }
}
</script>

<style scoped>
#iiif {
  padding: 2px;
}
</style>
