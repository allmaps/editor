<template>
  <div id="georectify">
    <div id="iiif" class="iiif"></div>
    <div id="map" class="map"></div>
  </div>
</template>

<script>
import Map from 'ol/Map'
import Feature from 'ol/Feature'
import View from 'ol/View'
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer'
import {Draw, Modify, Snap} from 'ol/interaction'
import {Point} from 'ol/geom'
import {GeoJSON} from 'ol/format'
// import {shiftKeyOnly, singleClick, primaryAction} from 'ol/events/condition'
import {OSM, Vector as VectorSource} from 'ol/source'
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style'
import IIIF from 'ol/source/IIIF'
import IIIFInfo from 'ol/format/IIIFInfo'
import {fromLonLat, toLonLat} from 'ol/proj'

import Document from './Document.vue'

import {deleteCondition} from '../lib/openlayers'

export default {
  name: 'Georectify',
  props: {
    iiif: Object,
		connection: Object,
		showAnnotation: Boolean
  },
  mixins: [Document],
  data () {
    return {
      data: [],
      iiifCoordinates: [],
      mapCoordinates: [],

      docType: 'gcps',

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
		showAnnotation: function () {
			window.setTimeout(this.onResize, 100)
		},
		data: function () {
			this.$emit('update', this.data)

			const iiifCoordinates = this.data.map((gcp) => gcp.pixel)
			const mapCoordinates = this.data.map((gcp) => gcp.world)

			this.iiifCoordinates = iiifCoordinates
			this.mapCoordinates = mapCoordinates

			this.mapSource.clear()
			this.iiifSource.clear()

			if (this.pointDifference() === 0) {
				this.iiifSource.addFeatures(this.iiifCoordinates.map((coordinates) => new Feature({
					geometry: new Point([
						coordinates[0],
						-coordinates[1]
					])
				})))

				this.mapSource.addFeatures(this.mapCoordinates.map((coordinates) => (new GeoJSON()).readFeature({
						type: 'Point',
						coordinates
				}, { featureProjection: 'EPSG:3857' })))

				// TODO: Only move if no user interaction has taken place
				const extent = this.mapSource.getExtent()
				this.mapOl.getView().fit(extent, {
					padding: [25, 25, 25, 25],
					maxZoom: 18
				})
			}
		},
		iiif: function () {
			if (this.iiif) {
				this.updateIiif(this.iiif)
			}
		}
	},
  methods: {
		round: function (num, decimals = 6) {
			const p = 10 ** decimals
			return Math.round((num + Number.EPSILON) * p) / p
		},
		onResize: function () {
			if (this.iiifOl && this.mapOl) {
				this.iiifOl.updateSize()
				this.mapOl.updateSize()
			}
		},
    pointDifference: function () {
			const iiifCoordinates = this.iiifCoordinates || []
			const mapCoordinates = this.mapCoordinates || []
			return iiifCoordinates.length - mapCoordinates.length
    },
    updateGcps: function () {
      const iiifFeatures = this.iiifVector.getSource().getFeatures()
			const mapFeatures = this.mapVector.getSource().getFeatures()

			if (iiifFeatures.length) {
				const iiifCoordinates = iiifFeatures
					.map((feature) => {
						const coordinate = feature.getGeometry().getCoordinates()
						return [
							Math.round(coordinate[0]),
							Math.round(-coordinate[1])
						]
					})

				this.iiifCoordinates = iiifCoordinates
			}

      if (mapFeatures.length) {
        const mapCoordinates = mapFeatures
          .map((feature) => {
            const geometry = feature.getGeometry().clone()
						geometry.transform('EPSG:3857', 'EPSG:4326')
						return geometry.getCoordinates()
							.map((coordinate) => this.round(coordinate))
					})

				this.mapCoordinates = mapCoordinates
			}

			if (this.pointDifference() === 0) {
				const data = this.iiifCoordinates.map((iiifCoordinate, index) => ({
          pixel: iiifCoordinate,
          world: this.mapCoordinates[index]
				}))

				this.commit(data)
			}
    },
    updateIiif: function (iiif) {
			const options = new IIIFInfo(iiif.imageInfo).getTileSourceOptions()
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

			this.iiifOl.getView().fit(iiifTileSource.getTileGrid().getExtent())
		}
  },
  mounted: function () {
		this.iiifLayer = new TileLayer()
		this.iiifSource = new VectorSource()

		this.iiifVector = new VectorLayer({
			source: this.iiifSource,
			style: new Style({
				stroke: new Stroke({
					color: '#e10800',
					width: 3
				}),
				image: new CircleStyle({
					radius: 7,
					fill: new Fill({
						color: '#e10800'
					})
				})
			})
    })

		this.iiifOl = new Map({
			layers: [this.iiifLayer, this.iiifVector],
			target: 'iiif'
    })

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
      condition: () =>
				this.pointDifference() === 0 || this.pointDifference() === -1
    })

    const mapDraw = new Draw({
			source: this.mapSource,
      type: 'Point',
      condition: () =>
				this.pointDifference() === 0 || this.pointDifference() === 1
		})

		this.iiifOl.addInteraction(iiifDraw)
		const iiifSnap = new Snap({source: this.iiifSource})
    this.iiifOl.addInteraction(iiifSnap)

    this.mapOl.addInteraction(mapDraw)
		const mapSnap = new Snap({source: this.mapSource})
		this.mapOl.addInteraction(mapSnap)

		this.iiifSource.on('addfeature', this.updateGcps)
    iiifModify.on('modifyend', this.updateGcps)

    this.mapSource.on('addfeature', this.updateGcps)
		mapModify.on('modifyend', this.updateGcps)

		if (this.iiif) {
			this.updateIiif(this.iiif)
		}
	}
}
</script>

<style scoped>
#georectify {
  display: flex;
  flex-direction: row;
}

#georectify > * {
  width: 50%;
  padding: 2px;
  box-sizing: border-box;
}
</style>
