<template>
  <div id="app">
    <Header />
    <!-- TODO: check ERROR -->
    <main>
      <!-- <template v-if="$route.name === 'preview'">
        <Preview :image="image"
          :showAnnotation="showAnnotation" />
      </template> -->
      <template v-if="$route.name === 'mask'">
        <PixelMask :image="image"
          :lastMapsUpdateSource="lastMapsUpdateSource"
          :showAnnotation="showAnnotation" />
      </template>
      <template v-else-if="$route.name === 'georeference'">
        <Georeference :image="image"
          :lastMapsUpdateSource="lastMapsUpdateSource"
          :showAnnotation="showAnnotation" />
      </template>
      <!-- <template v-else-if="$route.name === 'results'">
        <Results
          :images="images" :maps="maps"
          :selectedMapId="selectedMapId"
          :showAnnotation="showAnnotation" />
      </template> -->
      <template v-else>
        <Home class="padding"
          :mapCollections="mapCollections"
          :images="images" />
      </template>
      <transition name="slide">
        <template v-if="showAnnotation">
          <Annotation class="annotation"
            :annotation="annotation" />
        </template>
      </transition>
    </main>
    <Footer v-model:showAnnotation="showAnnotation"
      @copy-annotation="copyAnnotation"
      @download-annotation="downloadAnnotation"
      @save-annotation="saveAnnotation"

      :images="images"
      :activeImageId="activeImageId" />
  </div>
</template>

<style src='ol/ol.css'></style>
<style src='highlight.js/styles/sunburst.css'></style>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

import Home from './components/Home.vue'
import Georeference from './components/Georeference.vue'
import PixelMask from './components/PixelMask.vue'
import Annotation from './components/Annotation.vue'

import { generate } from '@allmaps/annotation'

// import mapCollections from '../../iiif-map-collections/iiif-map-collections.yml'

// SHAREDB
const WS_API_URL = process.env.VUE_APP_WS_API_URL
import ReconnectingWebSocket from 'reconnecting-websocket'
import ShareDB from 'sharedb/lib/client'
const json1 = require('ot-json1')
// SHAREDB

import { parseOperations } from './lib/json1-operations'
import { getIIIF } from './lib/iiif'
import { save } from './lib/api'

const serverUrl = process.env.VUE_APP_SERVER_URL

export default {
  name: 'app',
  components: {
    Header,
    Footer,
    Home,
    Georeference,
    PixelMask,
    Annotation
  },
  data () {
    return {
      iiifType: undefined,
      manifest: undefined,

      images: {},
      sortedImageIds: [],

      lastMapsUpdateSource: undefined,

      showAnnotation: false,
      error: undefined,
      numClicks: 0,

      mapCollections: [],
      loading: true
    }
  },
  methods: {
    ...mapActions('ui', [
      'setActiveImageId'
    ]),

    ...mapActions('maps', [
      'setMaps',
      'insertMap',
      'removeMap',
      'insertPixelMaskPoint',
      'removePixelMaskPoint',
      'replacePixelMaskPoint',
      'insertGcp',
      'replaceGcp',
      'removeGcp'
    ]),

    initializeDoc: function () {
      const source = 'ShareDB'

      if (!this.doc.version) {
        this.doc.create({}, json1.type.name)
      }

      // TODO: we now have two versions of the maps data
      // 1 in the ShareDB doc, one in the Vuex store
      // This needs to be merged into one!
      // For now:
      const maps = JSON.parse(JSON.stringify(this.doc.data))

      // either don't allow editing before share db is initialized,
      // or merge the 2 set of maps

      this.setMaps({ maps, source })
      this.loading = false
    },
    getDoc: function () {
      if (this.doc) {
        this.doc.destroy()
      }

      try {
        this.doc = this.connection.get('images', this.activeImageId)
      } catch (err) {
        console.error('vissen', err)
      }

      this.doc.subscribe(this.initializeDoc)
      this.doc.on('op', this.remoteOperation)
    },
    remoteOperation: function (op, localOperation) {
      if (!localOperation && op) {
        // remote operation from server

        const source = 'ShareDB'

        const operations = parseOperations(op)

        operations.forEach(({ mapId, type, key, instructions }) => {
          if (type === 'map' && instructions.i) {
            const { image, pixelMask, gcps } = instructions.i
            this.insertMap({
              mapId,
              image,
              pixelMask,
              gcps,
              source
            })
          } else if (type === 'map' && instructions.r) {
            this.removeMap({ mapId, source })
          } else if (type === 'pixelMask') {
            const index = key
            const pixelMaskPoint = instructions.i

            if (instructions.r && pixelMaskPoint) {
              this.replacePixelMaskPoint({
                mapId, index, pixelMaskPoint, source
              })
            } else if (pixelMaskPoint) {
              this.insertPixelMaskPoint({
                mapId, index, pixelMaskPoint, source
              })
            } else if (instructions.r) {
              this.removePixelMaskPoint({
                mapId, index, pixelMaskPoint, source
              })
            }
          } else if (type === 'gcps') {
            const gcpId = key
            const gcp = instructions.i

            if (instructions.r && gcp) {
              this.replaceGcp({
                mapId, gcpId, gcp, source
              })
            } else if (gcp) {
              this.insertGcp({
                mapId, gcpId, gcp, source
              })
            } else if (instructions.r) {
              this.removeGcp({
                mapId, gcpId, source
              })
            }
          }
        })
      }
    },
    onStoreMutation: function (mutation) {
      if (mutation.payload.source === 'ShareDB') {
        return
      }

      if (mutation.type === 'maps/insertMap') {
        const { mapId, map } = mutation.payload
        this.doc.submitOp(json1.insertOp([mapId], map))
      } else if (mutation.type === 'maps/removeMap') {
        const { mapId } = mutation.payload
        this.doc.submitOp(json1.removeOp([mapId]))
      } else if (mutation.type === 'maps/insertPixelMaskPoint') {
        const { mapId, index, pixelMaskPoint} = mutation.payload
        this.doc.submitOp(json1.insertOp([mapId, 'pixelMask', index], pixelMaskPoint))
      } else if (mutation.type === 'maps/removePixelMaskPoint') {
        const { mapId, index, pixelMaskPoint} = mutation.payload
        this.doc.submitOp(json1.removeOp([mapId, 'pixelMask', index], pixelMaskPoint))
      } else if (mutation.type === 'maps/replacePixelMaskPoint') {
        const { mapId, index, pixelMaskPoint} = mutation.payload
        // TODO: replace true with oldVal
        this.doc.submitOp(json1.replaceOp([mapId, 'pixelMask', index], true, pixelMaskPoint))
      } else if (mutation.type === 'maps/insertGcp') {
        const { mapId, gcpId, gcp} = mutation.payload
        // if (gcp.image && gcp.world) {
          this.doc.submitOp(json1.insertOp([mapId, 'gcps', gcpId], gcp))
        // }
      } else if (mutation.type === 'maps/replaceGcp') {
        const { mapId, gcpId, gcp} = mutation.payload
        // if (gcp.image && gcp.world) {
          // TODO: replace true with oldVal
          this.doc.submitOp(json1.replaceOp([mapId, 'gcps', gcpId], true, gcp))
        // }
      } else if (mutation.type === 'maps/removeGcp') {
        const { mapId, gcpId, gcp} = mutation.payload
        // if (gcp.image && gcp.world) {
          this.doc.submitOp(json1.removeOp([mapId, 'gcps', gcpId]))
        // }
      }
    },
    goToRoute: function (name) {
      this.$router.push({name, query: this.$route.query})
    },
    updateIiif: async function (url) {
      try {
        const { iiifType, manifest, images } = await getIIIF(url)

        this.iiifType = iiifType
        this.manifest = manifest
        this.images = images
        this.lastMapsUpdateSource = undefined

        this.sortedImageIds = Object.values(this.images)
          .map(({id, index}) => ({id, index}))
          .sort((a, b) => a.index - b.index)

        if (this.$route.query.image) {
          this.setActiveImageId({ imageId: this.$route.query.image })
        } else {
          this.setActiveImageId({ imageId: this.sortedImageIds[0].id })
        }
      } catch (err) {
        // TODO: fix!
        console.error(err)
        this.error = err.message
      }
    },
    computeGeoMask: function (map) {
      if (map.gcps && map.pixelMask) {
      //   const gcps = {
      //     type: 'FeatureCollection',
      //     features: map.gcps.map((gcp) => ({
      //       type: 'Feature',
      //       properties: {
      //         pixel: gcp.pixel
      //       },
      //       geometry: {
      //         type: 'Point',
      //         coordinates: gcp.world
      //       }
      //     }))
      //   }

      //   try {
      //     const transformer = createTransformer(gcps)
      //     const points = transformer.toWorld(map.pixelMask)

      //     const geoMask = {
      //       type: 'Polygon',
      //       coordinates: [points.coordinates]
      //     }

      //     return geoMask
      //   } catch (err) {
      //     // TODO: catch error!
      //   }
      }
    },
    copyAnnotation: function () {
      navigator.clipboard.writeText(this.annotationString)
    },
    downloadAnnotation: function () {
      const blob = new Blob([this.annotationString], {type : 'application/json'})
      const dataUrl = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      document.body.appendChild(a)
      a.style = 'display: none'

      a.href = dataUrl

      // TODO: proper filename
      // image.id
      a.download = 'annotation.json'
      a.click()
      window.URL.revokeObjectURL(dataUrl)
    },
    saveAnnotation: async function () {
      try {
        await save(this.manifest, this.images, this.maps)
      } catch (err) {
        console.error(err)
      }
    },
    keyPressHandler: function (event) {
      if (event.key === '[') {
        if (!this.images[this.activeImageId] || !this.images[this.activeImageId].previousImageId) {
          return
        }

        this.$router.push({name: this.$route.name, query: {
          ...this.$route.query,
          image: this.images[this.activeImageId].previousImageId
        }})
      } else if (event.key === ']') {
        if (!this.images[this.activeImageId] || !this.images[this.activeImageId].nextImageId) {
          return
        }

        this.$router.push({name: this.$route.name, query: {
          ...this.$route.query,
          image: this.images[this.activeImageId].nextImageId
        }})
      } else if (event.key === '1') {
        this.goToRoute('home')
      } else if (event.key === '2') {
        this.goToRoute('preview')
      } else if (event.key === '3') {
        this.goToRoute('mask')
      } else if (event.key === '4') {
        this.goToRoute('georeference')
      } else if (event.key === '5') {
        this.goToRoute('results')
      } else if (event.key === 'a') {
        this.showAnnotation = !this.showAnnotation
      }
    }
  },
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      maps: (state) => state.maps.maps
    }),
    annotation: function () {
      const maps = Object.values(this.maps)
        .map((map) => {

          return {
            ...map,
            pixelMask: [...map.pixelMask, map.pixelMask[0]],
            gcps: Object.values(map.gcps),
            image: map.image
          }
        })

      return generate(maps)
    },
    annotationString: function () {
      return JSON.stringify(this.annotation, null, 2)
    },
    image: function () {
      return this.images[this.activeImageId]
    },
    mapsForSelectedImage: function () {
      return Object.keys(this.maps)
        .filter((id) => this.maps[id].imageId === this.activeImageId)
        .reduce((maps, id) => ({
          ...maps,
          [id]: this.maps[id]
        }), {})
    }
  },
  watch: {
    '$route.query.url': function (url) {
      this.updateIiif(url)
    },
    '$route.query.image': function (imageId) {
      this.setActiveImageId({ imageId })
    },
    activeImageId: function () {
      this.getDoc()
    }
  },
  mounted: async function () {
    if (this.$route.query.url) {
      this.updateIiif(this.$route.query.url)
    }

    window.addEventListener('keypress', this.keyPressHandler)

    this.rws = new ReconnectingWebSocket(WS_API_URL)
    ShareDB.types.register(json1.type)
    this.connection = new ShareDB.Connection(this.rws)

    this.storeUnsubscribe = this.$store.subscribe(this.onStoreMutation)
  },
  beforeUnmount: function () {
    window.removeEventListener('keypress', this.keyPressHandler)

    this.storeUnsubscribe()

    if (this.doc) {
      this.doc.destroy()
    }

    this.connection.close()
    this.rws.close()
  }
}
</script>

<style>
html {
  height: 100%;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  position: absolute;

	font-family: 'Roboto', sans-serif;
	font-size: 18px;
}

.monospace {
	font-family: 'Roboto Mono', monospace;
}

main p a, main ul a, main ol a {
  word-break: break-all;
}

.padding {
  padding: 10px;
  box-sizing: border-box;
}

* {
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 18px;

  color: #2c3e50;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 100%;
}

header, footer {
  flex: none;
}

main {
  height: 0px;
  min-height: auto;

  display: flex;
  flex: 1 0 auto;
  flex-direction: row;
}

main > * {
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.annotation {
  width: calc(100% / 3);
  flex-shrink: 0;
}

button, input {
  font-size: 100%;
}

header, footer,
a, a:visited {
  color: #2c3e50;
}

button {
  border: none;
  display: inline-block;
  cursor: pointer;
  background-color: white;
  text-decoration: underline;
  padding: .25em;
  display: inline-block;
  line-height: 1;
}

button.primary {
  border: none;
  border-radius: 5px;
  background-color: #FFC742;
  color: black;
  text-decoration: none;
}

button.primary:hover {
  background-color: #FFE4A4;
}

.slide-enter-active, .slide-leave-active {
  transition: width .05s;
}

.slide-enter-from, .slide-leave-to {
  width: 0;
}
</style>
