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
import { shiftKeyOnly } from 'ol/events/condition'
import { Vector as VectorSource} from 'ol/source'
import { Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style'
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
    lastMapsUpdateSource: String
  },
  components: {
    Sidebar
  },
  data () {
    return {
      iiifOl: undefined,
      iiifSource: undefined,
      iiifLayer: undefined,
      iiifVector: undefined,

      dimensions: undefined
    }
  },
  watch: {
    activeMapId: function () {
      this.updateStyles()
    },
    showAnnotation: function () {
      window.setTimeout(this.onResize, 100)
    },
    image: function () {
      this.updateImage(this.image)
    },
    maps: function () {
      this.updatePixelMasks(this.maps)
    }
  },
  computed: {
    ...mapGetters('maps', {
      maps: 'mapsForActiveImage'
    }),
    ...mapState({
      activeMapId: (state) => state.ui.activeMapId
    })
  },
  methods: {
    ...mapActions('maps', [
      'addMap',
      'updateMap'
    ]),
    differentSource: function () {
      return this.lastMapsUpdateSource !== this.$options.name
    },
    onResize: function () {
      if (this.iiifOl) {
        this.iiifOl.updateSize()
      }
    },
    updateStyles: function () {
      this.iiifVector.setStyle((feature) => {
        const active = this.activeMapId === feature.getId()
        return new Style({
          stroke: new Stroke({
            color: '#C552B5',
            width: active ? 5 : 2
          })
        })
      })
    },
    updatePixelMasks: function (maps) {
      this.iiifSource.clear()

      if (maps) {
        Object.values(maps)
          .forEach((map) => {
            const feature = new Feature({
              geometry: new Polygon(this.maskToPolygon(map.pixelMask))
            })

            feature.setId(map.id)
            this.iiifSource.addFeature(feature)
          })
      }
    },
    createMap: function (feature) {
      const id = feature.getId()
      const polygon = feature.getGeometry().getCoordinates()
      const pixelMask = this.polygonToMask(polygon)

      return {
        id,
        imageId: this.image.id,
        pixelMask,
        imageDimensions: [
          this.image.width, this.image.height
        ]
        // TODO hash???
      }
    },
    onEdited: function (event) {
      const maps = {}

      if (event.type === 'addfeature') {
        const feature = event.feature

        if (feature.getId()) {
          return
        }

        feature.setId(randomId())

        const map = this.createMap(feature)
        this.addMap(map)
      } else if (event.type === 'modifyend') {
        event.features.forEach((feature) => {
          const map = this.createMap(feature)
          this.updateMap(map)
        })
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
    polygonToMask: function (polygon, dimensions = [1, 1]) {
      return polygon[0].map((coordinate) => ([
        coordinate[0] / dimensions[0],
        -coordinate[1] / dimensions[1]
      ].map((coordinate) => round(coordinate, 0))))
    },
    maskToPolygon: function (mask, dimensions = [1, 1]) {
      return [
        mask.map((coordinate) => ([
          coordinate[0] * dimensions[0],
          -coordinate[1] * dimensions[1]
        ]))
      ]
    }
  },
  mounted: function () {
    this.iiifLayer = new TileLayer()
    this.iiifSource = new VectorSource()

    this.iiifVector = new VectorLayer({
      source: this.iiifSource,
      style: new Style({
        stroke: new Stroke({
          color: '#C552B5',
          width: 3
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#C552B5'
          })
        })
      })
    })

    this.iiifOl = new Map({
      layers: [this.iiifLayer, this.iiifVector],
      target: 'iiif'
    })

    const iiifModify = new Modify({
      source: this.iiifSource,
      deleteCondition
    })
    this.iiifOl.addInteraction(iiifModify)

    const iiifDraw = new Draw({
      source: this.iiifSource,
      type: 'Polygon',
      freehandCondition: (event) => {
        return shiftKeyOnly(event)
      }
    })

    // Add polygon labels
    // https://openlayers.org/en/latest/examples/vector-labels.html

    this.iiifOl.addInteraction(iiifDraw)

    this.iiifSource.on('addfeature', this.onEdited)
    iiifModify.on('modifyend', this.onEdited)

    this.updateImage(this.image)
    this.updatePixelMasks(this.maps)
    this.updateStyles()
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
