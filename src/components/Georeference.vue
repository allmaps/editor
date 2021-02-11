<template>
  <div class="georeference">
    <Sidebar showGcps />
    <div class="container">
      <div id="iiif" class="iiif"></div>
      <div id="map" class="map"></div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import Sidebar from './Sidebar.vue'

import Map from 'ol/Map'
import Feature from 'ol/Feature'
import View from 'ol/View'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Draw, Modify } from 'ol/interaction'
import { Point } from 'ol/geom'
import { GeoJSON } from 'ol/format'
import { Vector as VectorSource } from 'ol/source'
import XYZ from 'ol/source/XYZ'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import IIIF from 'ol/source/IIIF'
import IIIFInfo from 'ol/format/IIIFInfo'
import { fromLonLat } from 'ol/proj'

import { deleteCondition } from '../lib/openlayers'
import { randomId } from '../lib/id'
import { round } from '../lib/functions'

export default {
  name: 'Georeference',
  props: {
    image: Object,
    showAnnotation: Boolean,

    // lastMapsUpdateSource: String
  },
  components: {
    Sidebar
  },
  data () {
    return {
      iiifPoints: [],
      mapPoints: [],

      iiifOl: undefined,
      iiifSource: undefined,
      iiifLayer: undefined,
      iiifVector: undefined,

      mapOl: undefined,
      mapSource: undefined,
      mapLayer: undefined,
      mapVector: undefined,

      dimensions: undefined
    }
  },
  watch: {
    activeMapId: function () {
      this.iiifSource.changed()
      this.updateGCPs(this.activeMap)
    },
    showAnnotation: function () {
      window.setTimeout(this.onResize, 100)
    },
    image: function () {
      this.updateImage(this.image)
    }
  },
  methods: {
    ...mapActions('maps', [
      'addMap',
      'updateMap'
    ]),
    // prerender: function (event) {
    //   if (this.maps.length === 0) {
    //     return
    //   }

    //   const ctx = event.context
    //   ctx.save()
    //   ctx.beginPath()

    //   const contextMask = this.selectedMap.pixelMask
    //     .map((point) => this.iiifOl.getPixelFromCoordinate([point[0], -point[1]]))

    //   ctx.moveTo(contextMask[0][0], contextMask[0][1])
    //   contextMask.slice(1).forEach((point) => {
    //     ctx.lineTo(point[0], point[1])
    //   })

    //   ctx.closePath()
    //   ctx.clip()
    // },
    // postrender: function (event) {
    //   const ctx = event.context
    //   ctx.restore()
    // },
    differentSource: function () {
      return this.lastMapsUpdateSource !== this.$options.name
    },
    onResize: function () {
      if (this.iiifOl && this.mapOl) {
        this.iiifOl.updateSize()
        this.mapOl.updateSize()
      }
    },
    pointDifference: function () {
      const iiifPoints = this.iiifPoints || []
      const mapPoints = this.mapPoints || []

      return iiifPoints.length - mapPoints.length
    },
    updateGCPs: function (map) {
      this.mapSource.clear()
      this.iiifSource.clear()

      const gcps = (map && map.gcps) || []

      if (!gcps || gcps.length === 0) {
        return
      }

      const iiifPoints = gcps.map((gcp) => gcp.image)
      const mapPoints = gcps.map((gcp) => gcp.world)

      const iiifFeatures = iiifPoints
        .map((coordinates, index) => {
          if (coordinates) {
            return new Feature({
              index,
              // id
              geometry: new Point([
                coordinates[0],
                -coordinates[1]
              ])
            })
          }
        })
        .filter((feature) => feature)

      const mapFeatures = mapPoints
        .map((coordinates, index) => {
          if (coordinates) {
            return  (new GeoJSON()).readFeature({
              type: 'Feature',
              // id
              properties: {
                index
              },
              geometry: {
                type: 'Point',
                coordinates
              }
            }, { featureProjection: 'EPSG:3857' })
          }
        })
        .filter((feature) => feature)

      this.iiifSource.addFeatures(iiifFeatures)
      this.mapSource.addFeatures(mapFeatures)

      //   if (!this.lastMapsUpdateSource) {
      const extent = this.mapSource.getExtent()
      this.mapOl.getView().fit(extent, {
        padding: [25, 25, 25, 25],
        maxZoom: 18
      })

    },
    onEdited: function (event) {
      if (event.type === 'addfeature') {
        const feature = event.feature
        const properties = feature.getProperties()

        if (properties.index === undefined) {
          const index = (this.activeMap && this.activeMap.gcps && this.activeMap.gcps.length) || 0
          feature.setProperties({
            index
          })
        }
      }

      const iiifFeatures = this.iiifVector.getSource().getFeatures()
      const mapFeatures = this.mapVector.getSource().getFeatures()

      if (iiifFeatures.length) {
        const iiifPoints = iiifFeatures
          .map((feature) => {
            const coordinate = feature.getGeometry().getCoordinates()
            return [
              Math.round(coordinate[0]),
              Math.round(-coordinate[1])
            ]
          })

        this.iiifPoints = iiifPoints
      }

      if (mapFeatures.length) {
        const mapPoints = mapFeatures
          .map((feature) => {
            const geometry = feature.getGeometry().clone()
            geometry.transform('EPSG:3857', 'EPSG:4326')
            return geometry.getCoordinates()
              .map((coordinate) => round(coordinate))
          })

        this.mapPoints = mapPoints
      }


      if (this.pointDifference() === 0) {
        const gcps = this.iiifPoints.map((iiifPoint, index) => ({
          image: iiifPoint,
          world: this.mapPoints[index]
        }))

        const imageId = this.image.id
        const imageDimensions = [
          this.image.width,
          this.image.height
        ]

        const mapId = this.activeMapId || randomId()

        let pixelMask
        if (this.activeMap && this.activeMap.pixelMask && this.activeMap.pixelMask.length) {
          pixelMask = this.activeMap.pixelMask
        } else {
          pixelMask = [
            [0, 0],
            [0, imageDimensions[1]],
            imageDimensions,
            [imageDimensions[0], 0],
            [0, 0]
          ]
        }

        const map = {
          id: mapId,
          gcps,
          imageId,
          pixelMask
        }

        if (this.activeMapId) {
          this.updateMap(map)
        } else {
          this.addMap(map)
        }
      }
    },
    updateImage: function (image) {
      if (!image || !image.iiif) {
        return
      }

      const options = new IIIFInfo(image.iiif).getTileSourceOptions()
      if (options === undefined || options.version === undefined) {
        throw new Error('Data seems to be no valid IIIF image information.')
      }

      options.zDirection = -1
      const iiifTileSource = new IIIF(options)
      this.iiifLayer.setSource(iiifTileSource)

      const extent = iiifTileSource.getTileGrid().getExtent()

      this.dimensions = [extent[2], -extent[1]]

      this.iiifOl.setView(new View({
        resolutions: iiifTileSource.getTileGrid().getResolutions(),
        extent,
        constrainOnlyCenter: true
      }))

      this.iiifOl.getView().fit(iiifTileSource.getTileGrid().getExtent(), {
        // TODO: move to settings file
        padding: [10, 10, 10, 10]
      })
    },
    gcpStyle: function (feature) {
      return new Style({
        stroke: new Stroke({
          color: '#E10800',
          width: 3
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#E10800'
          })
        }),
        text: this.gcpTextStyle(feature)
      })
    },
    gcpTextStyle: function (feature) {
      return new Text({
        scale: 1.5,
        text: this.gcpLabel(feature),
        fill: new Fill({color: '#000'}),
        stroke: new Stroke({color: '#fff', width: 2}),
        offsetX: 14,
        offsetY: 14
      })
    },
    gcpLabel: function (feature) {
      const properties = feature.getProperties()
      return String(properties.index + 1)
    }
  },
  computed: {
    ...mapState({
      activeMapId: (state) => state.ui.activeMapId
    }),
    ...mapGetters('maps', {
      maps: 'mapsForActiveImage',
      activeMap: 'activeMap'
    })
  },
  mounted: function () {
    this.iiifLayer = new TileLayer()
    this.iiifSource = new VectorSource()

    this.iiifVector = new VectorLayer({
      source: this.iiifSource,
      style: this.gcpStyle
    })

    this.iiifOl = new Map({
      layers: [this.iiifLayer, this.iiifVector],
      target: 'iiif'
    })

    this.mapLayer = new TileLayer({
      source: new XYZ({
        url: 'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png'
      })
    })
    this.mapSource = new VectorSource()

    this.mapVector = new VectorLayer({
      source: this.mapSource,
      style: this.gcpStyle
    })

    this.mapOl = new Map({
      layers: [this.mapLayer, this.mapVector],
      target: 'map',
      view: new View({
        center: fromLonLat([-77.036667, 38.895]),
        zoom: 3
      })
    })

    const iiifModify = new Modify({
      source: this.iiifSource,
      deleteCondition
    })

    const mapModify = new Modify({
      source: this.mapSource,
      deleteCondition
    })

    this.iiifOl.addInteraction(iiifModify)
    this.mapOl.addInteraction(mapModify)

    const iiifDraw = new Draw({
      source: this.iiifSource,
      type: 'Point',
      // condition: () =>
      //   this.pointDifference() === 0 || this.pointDifference() === -1
    })

    const mapDraw = new Draw({
      source: this.mapSource,
      type: 'Point',
      // condition: () =>
      //   this.pointDifference() === 0 || this.pointDifference() === 1
    })

    this.iiifOl.addInteraction(iiifDraw)

    this.mapOl.addInteraction(mapDraw)

    this.iiifSource.on('addfeature', this.onEdited)
    iiifModify.on('modifyend', this.onEdited)

    this.mapSource.on('addfeature', this.onEdited)
    mapModify.on('modifyend', this.onEdited)

    this.iiifLayer.on('prerender', this.prerender)
    this.iiifLayer.on('postrender', this.postrender)

    this.updateImage(this.image)
    this.updateGCPs(this.activeMap)
  }
}
</script>

<style scoped>
.georeference {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}

.container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}

.container > * {
  padding: 2px;
  width: 100%;
  box-sizing: border-box;
}
</style>
