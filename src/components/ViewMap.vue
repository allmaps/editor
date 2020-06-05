<template>
  <div id="map" class="map"></div>
</template>

<script>
import Map from 'ol/Map'
import Feature from 'ol/Feature'
import View from 'ol/View'
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer'
import {Point, Polygon} from 'ol/geom'
import {OSM, Vector as VectorSource} from 'ol/source'
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style'
import {GeoJSON} from 'ol/format'
import {fromLonLat, toLonLat} from 'ol/proj'

import {round} from '../lib/functions'
import {deleteCondition} from '../lib/openlayers'

export default {
  name: 'EditMask',
  props: {
    gcps: Array,
    geoMask: Object,
		showAnnotation: Boolean
	},
	data () {
    return {
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
		gcps: function () {
			this.update()
    },
    geoMask: function () {
      this.update()
    }
	},
	methods: {
		onResize: function () {
			if (this.mapOl) {
				this.mapOl.updateSize()
			}
		},
    update: function () {
      this.mapSource.clear()

			if (this.geoMask) {
				this.mapSource.addFeature((new GeoJSON()).readFeature(this.geoMask, { featureProjection: 'EPSG:3857' }))

				// TODO: Only move if no user interaction has taken place
				const extent = this.mapSource.getExtent()
				this.mapOl.getView().fit(extent, {
					padding: [25, 25, 25, 25],
					maxZoom: 18
				})
			}
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

		this.mapOl = new Map({
			layers: [this.mapLayer, this.mapVector],
      target: 'map',
      view: new View({
        center: fromLonLat([-77.036667, 38.895]),
        zoom: 3
      })
    })

		this.update()
	}
}
</script>

<style scoped>
#iiif {
	padding: 2px;
}
</style>
