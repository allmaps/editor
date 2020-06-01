<template>
  <div id="iiif" class="iiif"></div>
</template>

<script>
import Map from 'ol/Map'
import Feature from 'ol/Feature'
import View from 'ol/View'
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer'
import {Draw, Modify, Snap} from 'ol/interaction'
import {Polygon} from 'ol/geom'
import {shiftKeyOnly} from 'ol/events/condition'
import {Vector as VectorSource} from 'ol/source'
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style'
import IIIF from 'ol/source/IIIF'
import IIIFInfo from 'ol/format/IIIFInfo'

import Document from './Document.vue'

import {round} from '../lib/functions'
import {deleteCondition} from '../lib/openlayers'

export default {
  name: 'EditMask',
  props: {
		iiif: Object,
		connection: Object,
		showAnnotation: Boolean
	},
	mixins: [Document],
	data () {
    return {
			data: [],
			docType: 'masks',

			iiifOl: undefined,
			iiifSource: undefined,
			iiifLayer: undefined,
			iiifVector: undefined,

			dimensions: undefined
		}
	},
	watch: {
		showAnnotation: function () {
			window.setTimeout(this.onResize, 100)
		},
		data: function () {
			this.$emit('update', this.data)
			this.iiifSource.clear()
			if (this.data && this.data.length) {
				this.iiifSource.addFeature(new Feature({
					// geometry: new Polygon(this.maskToPolygon(this.data, this.dimensions))
					geometry: new Polygon(this.maskToPolygon(this.data))
				}))
			}
		},
		iiif: function () {
			if (this.iiif) {
				this.updateIiif(this.iiif)
			}
		}
	},
	methods: {
		onResize: function () {
			if (this.iiifOl) {
				this.iiifOl.updateSize()
			}
		},
		updateMask: function () {
			const features = this.iiifVector.getSource().getFeatures()

			let data
			if (features && features.length) {
				const polygon = features[0].getGeometry().getCoordinates()
				data = this.polygonToMask(polygon) //, this.dimensions)
			} else {
				data = []
			}

			this.commit(data)
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
		},
		// clearMask: function () {
		// 	source.clear()
		// 	updateMask()
		// }
		emptyMask: function () {
			return this.data === undefined || this.data.length === 0
		}
	},
	mounted: function () {
		this.iiifLayer = new TileLayer()
		this.iiifSource = new VectorSource()

		this.iiifVector = new VectorLayer({
			source: this.iiifSource,
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
				return this.emptyMask() && shiftKeyOnly(event)
			},
			condition: () => {
				return this.emptyMask()
			}
		})

		this.iiifOl.addInteraction(iiifDraw)
		const iiifSnap = new Snap({source: this.iiifSource})
		this.iiifOl.addInteraction(iiifSnap)

		this.iiifSource.on('addfeature', this.updateMask)
		iiifModify.on('modifyend', this.updateMask)

		if (this.iiif) {
			this.updateIiif(this.iiif)
		}
	}
}
</script>

<style scoped>
#iiif {
	padding: 2px;
}
</style>
