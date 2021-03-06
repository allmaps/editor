<template>
  <div class="container">
    <Sidebar />
    <div id="iiif" class="iiif"></div>
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
import { Polygon} from 'ol/geom'
import { Vector as VectorSource} from 'ol/source'
import { Fill, Stroke, Style, Text } from 'ol/style'
import IIIF from 'ol/source/IIIF'
import IIIFInfo from 'ol/format/IIIFInfo'

import { round } from '../lib/functions'
import { randomId } from '../lib/id'
import { deleteCondition } from '../lib/openlayers'

export default {
  name: 'PixelMask',
  props: {
    image: Object,
    showAnnotation: Boolean,
  },
  components: {
    Sidebar
  },
  data () {
    return {
      dimensions: undefined
    }
  },
  watch: {
    activeMapId: function () {
      this.updateStyles()
      this.initializePixelMasks(this.maps)
    },
    showAnnotation: function () {
      window.setTimeout(this.onResize, 100)
    },
    image: function () {
      this.updateImage(this.image)
    }
  },
  computed: {
    ...mapGetters('maps', {
      maps: 'mapsForActiveImage'
    }),
    ...mapState({
      activeMapId: (state) => state.ui.activeMapId
    }),
    source: function () {
      return this.$options.name
    }
  },
  methods: {
    ...mapActions('maps', [
      'insertMap',
      'insertPixelMaskPoint',
      'removePixelMaskPoint',
      'replacePixelMaskPoint'
    ]),
    addFeature: function (map, index) {
      const feature = new Feature({
        index,
        geometry: new Polygon(this.maskToPolygon(map.pixelMask))
      })

      feature.setId(map.id)
      this.iiifSource.addFeature(feature)
    },
    onStoreMutation: function (mutation) {
      if (mutation.payload.source === this.source) {
        return
      }

      const mapId = mutation.payload.mapId

      if (mutation.type === 'maps/insertMap') {
        const map = mutation.payload.map
        const index = Object.keys(this.maps).length - 1
        this.addFeature(map, index)
      } else if (mutation.type === 'maps/removeMap') {
        const iiifFeature = this.iiifSource.getFeatureById(mapId)

        if (iiifFeature) {
          this.iiifSource.removeFeature(iiifFeature)
        }
      } else if ([
        'maps/insertPixelMaskPoint',
        'maps/replacePixelMaskPoint',
        'maps/removePixelMaskPoint',
        ].includes(mutation.type)) {
          const iiifFeature = this.iiifSource.getFeatureById(mapId)
          iiifFeature.setGeometry(new Polygon(this.maskToPolygon(this.maps[mapId].pixelMask)))
        }
    },
    onResize: function () {
      if (this.iiifOl) {
        this.iiifOl.updateSize()
      }
    },
    updateStyles: function () {
      this.iiifVector.setStyle(this.maskStyle)
    },
    initializePixelMasks: function (maps) {
      this.iiifSource.clear()

      if (maps) {
        Object.values(maps)
          .forEach(this.addFeature)
      }
    },
    pointsEqual: function (point1, point2) {
      return point1[0] === point2[0] && point1[1] === point2[1]
    },
    polygonDifference: function (oldPolygon, newPolygon) {
      const minLength = Math.min(oldPolygon.length, newPolygon.length)

      let index = 0
      for (index; index < minLength; index++) {
        if (!this.pointsEqual(oldPolygon[index], newPolygon[index])) {
          break
        }
      }

      if (oldPolygon.length < newPolygon.length) {
        // point inserted
        return {
          index,
          operation: 'insert',
          pixelMaskPoint: newPolygon[index]
        }
      } else if (oldPolygon.length > newPolygon.length) {
        // point removed
        return {
          index,
          operation: 'remove',
          pixelMaskPoint: oldPolygon[index]
        }
      } else if (index < minLength) {
        // point updated
        return {
          index,
          operation: 'replace',
          pixelMaskPoint: newPolygon[index]
        }
      }
    },
    onEdited: function (event) {
      if (event.type === 'addfeature') {
        const feature = event.feature

        if (feature.getId()) {
          return
        }

        feature.setProperties({
          index: Object.keys(this.maps).length
        })

        const mapId = randomId()
        feature.setId(mapId)

        this.insertMap({
          mapId,
          image: {
            id: this.image.id,
            uri: this.image.uri,
            dimensions: [...this.image.dimensions]
          },
          pixelMask: this.featurePolygon(feature),
          source: this.source
        })
      } else if (event.type === 'modifystart') {
        const feature = event.features.item(0)
        if (feature) {
          this.modifyingPolygon = this.featurePolygon(feature)
        }
      } else if (event.type === 'modifyend') {
        if (event.features.getLength() > 1) {
          // throw new Error('Multiple masks edited at once!')
          console.error('Multiple masks edited at once!')
        } else if (event.features.getLength() === 0) {
          return
        }

        const feature = event.features.item(0)
        const mapId = feature.getId()

        const diff = this.polygonDifference(this.modifyingPolygon, this.featurePolygon(feature))
        if (diff) {
          const { operation, index, pixelMaskPoint } = diff
          const payload = {
            mapId,
            index,
            pixelMaskPoint,
            source: this.source
          }

          if (operation === 'insert') {
            this.insertPixelMaskPoint(payload)
          } else if (operation === 'replace') {
            this.replacePixelMaskPoint(payload)
          } else if (operation === 'remove') {
            this.removePixelMaskPoint(payload)
          }
        }

        this.modifyingPolygon = undefined
      }
    },
    updateImage: function (image) {
      if (!image) {
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
    polygonToMask: function (polygon) {
      return polygon[0].slice(0, -1).map((coordinate) => ([
        coordinate[0],
        -coordinate[1]
      ].map((coordinate) => round(coordinate, 0))))
    },
    maskToPolygon: function (pixelMask) {
      return [
        [
          ...pixelMask.map((coordinate) => ([
            coordinate[0],
            -coordinate[1]
          ])),
          [
            pixelMask[0][0],
            -pixelMask[0][1]
          ]
        ]
      ]
    },
    featurePolygon: function (feature) {
      return this.polygonToMask(feature.getGeometry().getCoordinates())
    },
    maskTextStyle: function (feature) {
      return new Text({
        scale: 1.5,
        text: this.maskLabel(feature),
        fill: new Fill({color: '#000'}),
        stroke: new Stroke({color: '#fff', width: 2}),
        placement: 'point',
        align: 'center',
        baseline: 'middle',
        overflow: true
      })
    },
    maskLabel: function (feature) {
      const properties = feature.getProperties()
      return String(properties.index + 1)
    },
    maskStyle: function (feature) {
      const active = this.activeMapId === feature.getId()

      return new Style({
        stroke: new Stroke({
          color: '#C552B5',
          width: active ? 5 : 2
        }),
        text: this.maskTextStyle(feature)
      })
    }
  },
  mounted: function () {
    this.iiifLayer = new TileLayer()
    this.iiifSource = new VectorSource()

    this.iiifVector = new VectorLayer({
      source: this.iiifSource,
      style: this.maskStyle
    })

    this.iiifOl = new Map({
      layers: [this.iiifLayer, this.iiifVector],
      target: 'iiif'
    })

    this.iiifModify = new Modify({
      source: this.iiifSource,
      deleteCondition
    })
    this.iiifOl.addInteraction(this.iiifModify)

    const iiifDraw = new Draw({
      source: this.iiifSource,
      type: 'Polygon',
      freehandCondition: (event) => false
    })

    // Add polygon labels
    // https://openlayers.org/en/latest/examples/vector-labels.html

    this.iiifOl.addInteraction(iiifDraw)

    this.iiifSource.on('addfeature', this.onEdited)
    this.iiifModify.on('modifystart', this.onEdited)
    this.iiifModify.on('modifyend', this.onEdited)

    this.storeUnsubscribe = this.$store.subscribe(this.onStoreMutation)

    this.updateImage(this.image)
    this.initializePixelMasks(this.maps)
    this.updateStyles()
  },
  beforeUnmount: function () {
    this.iiifSource.un('addfeature', this.onEdited)
    this.iiifModify.un('modifystart', this.onEdited)
    this.iiifModify.un('modifyend', this.onEdited)

    this.storeUnsubscribe()
  }
}
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}

#iiif {
  width: 100%;
  height: 100%;
  padding: 2px;
}
</style>
