<template>
  <div class="panes">
    <div id="iiif" class="iiif ol-controls-left"></div>
    <div id="map" class="map ol-controls-right"></div>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import Map from 'ol/Map'
import Feature from 'ol/Feature'
import View from 'ol/View'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Draw, Modify } from 'ol/interaction'
import { Point, Polygon } from 'ol/geom'
import { GeoJSON } from 'ol/format'
import { Vector as VectorSource } from 'ol/source'
import Zoom from 'ol/control/Zoom'
import XYZ from 'ol/source/XYZ'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import IIIF from 'ol/source/IIIF'
import IIIFInfo from 'ol/format/IIIFInfo'
import { fromLonLat } from 'ol/proj'

import { generateRandomId } from '@allmaps/id'

import {
  deleteCondition,
  TileLayerControl,
  maskToPolygon
} from '../lib/openlayers'
import { createFullImageMap } from '../lib/map'
import { round } from '../lib/functions'

export default {
  name: 'Georeference',
  data: function () {
    return {
      singleIiifFeatures: [],
      singleMapFeatures: [],

      dimensions: undefined
    }
  },
  watch: {
    activeMapId: function () {
      this.iiifSource.changed()
      this.initializeGCPs(this.activeMap)
      this.initializeResourceMask(this.activeMap)
    },
    activeImage: function () {
      this.updateImage(this.activeImage)
      this.initializeGCPs(this.activeMap)
      this.initializeResourceMask(this.activeMap)
    },
    userBaseMapUrl: function () {
      this.tileLayerControl.setUserBaseMapUrl(this.userBaseMapUrl)
    }
  },
  methods: {
    ...mapActions('maps', [
      'insertMap',
      'insertGcp',
      'replaceGcp',
      'removeGcp'
    ]),
    onStoreMutation: function (mutation) {
      if (!mutation || !mutation.payload) {
        return
      }

      if (!mutation.type.startsWith('maps/')) {
        return
      }

      if (mutation.payload.source === this.source) {
        return
      }

      const mapId = mutation.payload.mapId

      if (mutation.type === 'maps/removeMap') {
        this.clearGcps()
        return
      } else if (this.activeMapId !== mapId) {
        return
      }

      const gcpId = mutation.payload.gcpId
      const gcp = mutation.payload.gcp

      if (mutation.type === 'maps/removeGcp') {
        const iiifFeature = this.iiifSource.getFeatureById(gcpId)
        const mapFeature = this.mapSource.getFeatureById(gcpId)

        if (iiifFeature) {
          this.iiifSource.removeFeature(iiifFeature)
        }

        if (mapFeature) {
          this.mapSource.removeFeature(mapFeature)
        }

        this.singleIiifFeatures = this.singleIiifFeatures.filter(
          (feature) => feature && feature.getId() !== gcpId
        )

        this.singleMapFeatures = this.singleMapFeatures.filter(
          (feature) => feature && feature.getId() !== gcpId
        )
      } else if (
        mutation.type === 'maps/insertGcp' ||
        mutation.type === 'maps/replaceGcp'
      ) {
        const iiifFeature = this.iiifSource.getFeatureById(gcpId)
        const mapFeature = this.mapSource.getFeatureById(gcpId)

        if (gcp.resource) {
          const coordinates = gcp.resource
          if (iiifFeature) {
            iiifFeature
              .getGeometry()
              .setCoordinates([coordinates[0], -coordinates[1]])
          } else {
            const index = this.iiifSource.getFeatures().length

            const iiifFeature = new Feature({
              index,
              geometry: new Point([coordinates[0], -coordinates[1]])
            })

            iiifFeature.setId(gcp.id)

            if (!gcp.geo) {
              if (
                !this.singleIiifFeatures.some(
                  (feature) => feature && feature.getId() === gcp.id
                )
              ) {
                this.singleIiifFeatures.push(iiifFeature)
              }
            }

            this.iiifSource.addFeature(iiifFeature)
          }
        }

        if (gcp.geo) {
          const coordinates = gcp.geo
          if (mapFeature) {
            mapFeature.getGeometry().setCoordinates(fromLonLat(coordinates))
          } else {
            const index = this.mapSource.getFeatures().length

            const mapFeature = new GeoJSON().readFeature(
              {
                type: 'Feature',
                id: gcp.id,
                properties: {
                  index
                },
                geometry: {
                  type: 'Point',
                  coordinates
                }
              },
              { featureProjection: 'EPSG:3857' }
            )

            mapFeature.setId(gcp.id)

            if (!gcp.resource) {
              if (
                !this.singleMapFeatures.some(
                  (feature) => feature && feature.getId() === gcp.id
                )
              ) {
                this.singleMapFeatures.push(mapFeature)
              }
            }

            this.mapSource.addFeature(mapFeature)
          }
        }
      }
    },
    // prerender: function (event) {
    //   const map = this.activeMap

    //   if (!map || !map.resourceMask.length) {
    //     return
    //   }

    //   const ctx = event.context
    //   ctx.save()
    //   ctx.beginPath()

    //   const contextMask = map.resourceMask
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
    onResize: function () {
      if (this.iiifOl && this.mapOl) {
        this.iiifOl.updateSize()
        this.mapOl.updateSize()
      }
    },
    pointDifference: function () {
      const iiifFeatures = this.iiifSource.getFeatures()
      const mapFeatures = this.mapSource.getFeatures()

      return iiifFeatures.length - mapFeatures.length
    },
    gcpFromGcpId: function (gcpId) {
      const iiifFeature = this.iiifSource.getFeatureById(gcpId)
      const mapFeature = this.mapSource.getFeatureById(gcpId)

      let iiifPoint
      if (iiifFeature) {
        iiifPoint = this.iiifFeatureToPoint(iiifFeature)
      }

      let mapPoint
      if (mapFeature) {
        mapPoint = this.mapFeatureToPoint(mapFeature)
      }

      return {
        id: gcpId,
        // TODO: order:
        resource: iiifPoint,
        geo: mapPoint
      }
    },
    clearGcps: function () {
      this.mapSource.clear()
      this.iiifSource.clear()

      this.singleIiifFeatures = []
      this.singleMapFeatures = []
    },
    initializeGCPs: function (map) {
      this.clearGcps()

      // TODO: order by order
      const gcps = (map && Object.values(map.gcps)) || []

      if (!gcps || gcps.length === 0) {
        return
      }

      const iiifFeatures = gcps
        .map((gcp, index) => {
          const coordinates = gcp.resource
          if (coordinates) {
            const feature = new Feature({
              index,
              // TODO: set properties order
              geometry: new Point([coordinates[0], -coordinates[1]])
            })

            feature.setId(gcp.id)

            if (!gcp.geo) {
              this.singleIiifFeatures.push(feature)
            }

            return feature
          }
        })
        .filter((feature) => feature)

      const mapFeatures = gcps
        .map((gcp, index) => {
          const coordinates = gcp.geo

          if (coordinates) {
            const feature = new GeoJSON().readFeature(
              {
                type: 'Feature',
                id: gcp.id,
                properties: {
                  index
                },
                geometry: {
                  type: 'Point',
                  coordinates
                }
              },
              { featureProjection: 'EPSG:3857' }
            )

            feature.setId(gcp.id)

            if (!gcp.resource) {
              this.singleMapFeatures.push(feature)
            }

            return feature
          }
        })
        .filter((feature) => feature)

      this.iiifSource.addFeatures(iiifFeatures)
      this.mapSource.addFeatures(mapFeatures)

      if (mapFeatures.length > 0) {
        const extent = this.mapSource.getExtent()
        this.mapOl.getView().fit(extent, {
          // TODO: get from config
          padding: [25, 25, 25, 25],
          maxZoom: 18
        })
      }
    },
    initializeResourceMask: function (map) {
      this.iiifResourceMaskSource.clear()

      if (!map || !map.resourceMask.length) {
        return
      }

      const resourceMaskFeature = new Feature({
        geometry: new Polygon(maskToPolygon(map.resourceMask))
      })

      resourceMaskFeature.setId(map.id)
      this.iiifResourceMaskSource.addFeature(resourceMaskFeature)
    },
    iiifFeatureToPoint: function (feature) {
      const coordinate = feature.getGeometry().getCoordinates()
      return [Math.round(coordinate[0]), Math.round(-coordinate[1])]
    },
    mapFeatureToPoint: function (feature) {
      const geometry = feature.getGeometry().clone()
      geometry.transform('EPSG:3857', 'EPSG:4326')

      // 7 decimal places should be enough...
      // See https://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude
      return geometry.getCoordinates().map((coordinate) => round(coordinate, 7))
    },
    onEdited: async function (event) {
      if (event.type === 'addfeature') {
        const feature = event.feature

        if (feature.getId()) {
          return
        }

        let gcpId
        let newGcpId

        const pointDifference = this.pointDifference()
        if (
          (pointDifference > 0 && event.target === this.iiifSource) ||
          (pointDifference < 0 && event.target === this.mapSource)
        ) {
          gcpId = await generateRandomId()
          newGcpId = true

          if (event.target === this.iiifSource) {
            this.singleIiifFeatures.push(feature)
          } else {
            this.singleMapFeatures.push(feature)
          }
        } else {
          if (event.target === this.iiifSource) {
            const matchingMapFeature = this.singleMapFeatures.shift()
            gcpId = matchingMapFeature.getId()
          } else {
            const matchingIiifFeature = this.singleIiifFeatures.shift()
            gcpId = matchingIiifFeature.getId()
          }
        }

        feature.setId(gcpId)

        // TODO: set order

        let index
        if (event.target === this.iiifSource) {
          index = this.iiifSource.getFeatures().length - 1
        } else {
          index = this.mapSource.getFeatures().length - 1
        }

        feature.setProperties({
          index
        })

        const gcp = this.gcpFromGcpId(gcpId)

        if (this.activeMapId) {
          const mapId = this.activeMapId

          if (newGcpId) {
            this.insertGcp({ mapId, gcpId, gcp, source: this.source })
          } else {
            this.replaceGcp({ mapId, gcpId, gcp, source: this.source })
          }
        } else {
          const map = await createFullImageMap(this.activeImage)
          const { id: mapId, resource, resourceMask } = map

          const gcps = {
            [gcpId]: gcp
          }

          this.insertMap({
            mapId,
            resource,
            resourceMask,
            gcps,
            source: this.source
          })
        }
      } else if (event.type === 'modifyend') {
        const mapId = this.activeMapId

        const feature = event.features.item(0)
        const gcpId = feature.getId()

        if (!gcpId) {
          console.error('GCP without ID encountered')
        } else {
          const gcp = this.gcpFromGcpId(gcpId)
          this.replaceGcp({ mapId, gcpId, gcp, source: this.source })
        }
      }

      // const iiifFeatures = this.iiifVector.getSource().getFeatures()
      // const mapFeatures = this.mapVector.getSource().getFeatures()

      // if (iiifFeatures.length) {
      //   const iiifPoints = iiifFeatures
      //     .map((feature) => {
      //       const coordinate = feature.getGeometry().getCoordinates()
      //       return [
      //         Math.round(coordinate[0]),
      //         Math.round(-coordinate[1])
      //       ]
      //     })

      //   this.iiifPoints = iiifPoints
      // }

      // if (mapFeatures.length) {
      //   const mapPoints = mapFeatures
      //     .map((feature) => {
      //       const geometry = feature.getGeometry().clone()
      //       geometry.transform('EPSG:3857', 'EPSG:4326')
      //       return geometry.getCoordinates()
      //         .map((coordinate) => round(coordinate))
      //     })

      //   this.mapPoints = mapPoints
      // }

      // if (this.pointDifference() === 0) {
      //   const gcps = this.iiifPoints.map((iiifPoint, index) => ({
      //     image: iiifPoint,
      //     world: this.mapPoints[index]
      //   }))

      //   if (this.activeMapId) {

      //   } else {

      //   }

      //   const imageId = this.image.id
      //   const imageDimensions = [
      //     this.image.width,
      //     this.image.height
      //   ]

      //   const mapId = this.activeMapId || await createRandomId()

      //   let resourceMask
      //   if (this.activeMap && this.activeMap.resourceMask && this.activeMap.resourceMask.length) {
      //     resourceMask = this.activeMap.resourceMask
      //   } else {
      //     resourceMask = [
      //       [0, 0],
      //       [0, imageDimensions[1]],
      //       imageDimensions,
      //       [imageDimensions[0], 0],
      //       [0, 0]
      //     ]
      //   }

      //   const map = {
      //     id: mapId,
      //     gcps,
      //     imageId,
      //     resourceMask
      //   }

      //   if (this.activeMapId) {
      //     this.insertMap(map)
      //   } else {
      //     this.addMap(map)
      //   }
      // }
    },
    updateImage: function (image) {
      if (!image || !image.sourceIiif) {
        return
      }

      const options = new IIIFInfo(image.sourceIiif).getTileSourceOptions()
      if (options === undefined || options.version === undefined) {
        throw new Error('Data seems to be no valid IIIF image information.')
      }

      options.zDirection = -1
      const iiifTileSource = new IIIF(options)
      this.iiifLayer.setSource(iiifTileSource)

      const extent = iiifTileSource.getTileGrid().getExtent()

      this.dimensions = [extent[2], -extent[1]]

      this.iiifOl.setView(
        new View({
          resolutions: iiifTileSource.getTileGrid().getResolutions(),
          extent,
          constrainOnlyCenter: true
        })
      )

      this.iiifOl.getView().fit(iiifTileSource.getTileGrid().getExtent(), {
        // TODO: move to settings file
        padding: [90, 10, 90, 10]
      })
    },
    resourceMaskStyle: function () {
      return new Style({
        stroke: new Stroke({
          color: '#E10800',
          width: 1.5
        })
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
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
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
      activeMapId: (state) => state.ui.activeMapId,
      maps: (state) => state.maps.maps
    }),
    ...mapGetters('maps', {
      activeMap: 'activeMap'
    }),
    ...mapGetters('ui', {
      activeImage: 'activeImage',
      userBaseMapUrl: 'userBaseMapUrl'
    }),
    source: function () {
      return this.$options.name
    }
  },
  mounted: function () {
    this.iiifLayer = new TileLayer()
    this.iiifSource = new VectorSource()
    this.iiifResourceMaskSource = new VectorSource()

    this.iiifVector = new VectorLayer({
      source: this.iiifSource,
      style: this.gcpStyle
    })

    this.iiifResourceMask = new VectorLayer({
      source: this.iiifResourceMaskSource,
      style: this.resourceMaskStyle
    })

    this.iiifOl = new Map({
      layers: [this.iiifLayer, this.iiifResourceMask, this.iiifVector],
      target: 'iiif'
    })

    this.mapLayer = new TileLayer({
      source: new XYZ({
        maxZoom: 19
      })
    })
    this.mapSource = new VectorSource()

    this.mapVector = new VectorLayer({
      source: this.mapSource,
      style: this.gcpStyle
    })

    let bbox
    if (this.$route.query.bbox) {
      const bboxString = this.$route.query.bbox
      const bboxStringParts = bboxString.split(',')

      if (bboxStringParts.length === 4) {
        try {
          bbox = bboxStringParts.map((str) => parseFloat(str))
        } catch (err) {
          console.error('Error parsing bbox parameter:', bboxString)
        }
      }
    }

    this.tileLayerControl = new TileLayerControl({
      tileLayer: this.mapLayer,
      userBaseMapUrl: this.userBaseMapUrl
    })

    this.mapOl = new Map({
      layers: [this.mapLayer, this.mapVector],
      controls: [new Zoom(), this.tileLayerControl],
      target: 'map',
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        maxZoom: 22
      })
    })

    if (bbox) {
      const extent = [
        ...fromLonLat([bbox[0], bbox[1]]),
        ...fromLonLat([bbox[2], bbox[3]])
      ]

      this.mapOl.getView().fit(extent, {
        // TODO: get from config
        padding: [25, 25, 25, 25],
        maxZoom: 18
      })
    }

    this.iiifModify = new Modify({
      source: this.iiifSource,
      deleteCondition
    })

    this.mapModify = new Modify({
      source: this.mapSource,
      deleteCondition
    })

    this.iiifOl.addInteraction(this.iiifModify)
    this.mapOl.addInteraction(this.mapModify)

    const iiifDraw = new Draw({
      source: this.iiifSource,
      type: 'Point'
    })

    const mapDraw = new Draw({
      source: this.mapSource,
      type: 'Point'
    })

    this.iiifOl.addInteraction(iiifDraw)
    this.mapOl.addInteraction(mapDraw)

    this.iiifSource.on('addfeature', this.onEdited)
    this.iiifModify.on('modifyend', this.onEdited)

    this.mapSource.on('addfeature', this.onEdited)
    this.mapModify.on('modifyend', this.onEdited)

    // this.iiifLayer.on('prerender', this.prerender)
    // this.iiifLayer.on('postrender', this.postrender)

    this.storeUnsubscribe = this.$store.subscribe(this.onStoreMutation)

    this.updateImage(this.activeImage)
    this.initializeGCPs(this.activeMap)
    this.initializeResourceMask(this.activeMap)
  },
  beforeDestroy: function () {
    this.iiifSource.un('addfeature', this.onEdited)
    this.iiifModify.un('modifyend', this.onEdited)

    this.mapSource.un('addfeature', this.onEdited)
    this.mapModify.un('modifyend', this.onEdited)

    // this.iiifLayer.un('prerender', this.prerender)
    // this.iiifLayer.un('postrender', this.postrender)

    this.storeUnsubscribe()
  }
}
</script>

<style scoped>
.panes {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  background-color: var(--green-4);
}

.panes > * {
  width: 100%;
  box-sizing: border-box;
}
</style>
