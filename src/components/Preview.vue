<template>
  <div id="iiif" class="iiif"></div>
</template>

<script>
import Map from 'ol/Map'
import View from 'ol/View'
import { Tile as TileLayer } from 'ol/layer'
import IIIF from 'ol/source/IIIF'
import IIIFInfo from 'ol/format/IIIFInfo'

export default {
  name: 'Preview',
  props: {
    image: Object,
    showAnnotation: Boolean
  },
  data () {
    return {
      iiifOl: undefined,
      iiifSource: undefined,
      iiifLayer: undefined
    }
  },
  watch: {
    showAnnotation: function () {
      window.setTimeout(this.onResize, 100)
    },
    image: function () {
      this.updateIiif(this.image)
    }
  },
  methods: {
    onResize: function () {
      if (this.iiifOl) {
        this.iiifOl.updateSize()
      }
    },
    updateIiif: function (image) {
      const options = new IIIFInfo(image.iiif).getTileSourceOptions()
      if (options === undefined || options.version === undefined) {
        throw new Error('Data seems to be no valid IIIF image information.')
      }

      options.zDirection = -1
      const iiifTileSource = new IIIF(options)
      this.iiifLayer.setSource(iiifTileSource)

      const extent = iiifTileSource.getTileGrid().getExtent()

      this.iiifOl.setView(new View({
        resolutions: iiifTileSource.getTileGrid().getResolutions(),
        extent,
        constrainOnlyCenter: true
      }))

      this.iiifOl.getView().fit(iiifTileSource.getTileGrid().getExtent())
    }
  },
  mounted: function () {
    this.iiifLayer = new TileLayer()

    this.iiifOl = new Map({
      layers: [this.iiifLayer],
      target: 'iiif'
    })

    if (this.image) {
      this.updateIiif(this.image)
    }
  }
}
</script>

<style scoped>
#iiif {
  padding: 2px;
}
</style>
