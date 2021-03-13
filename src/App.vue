<template>
  <div id="app">
    <Header />
    <!-- TODO: check ERROR -->
    <main>
      <template v-if="$route.name === 'collection'">
        <Collection :images="images" />
      </template>
      <template v-else-if="$route.name === 'mask'">
        <PixelMask :image="image" />
      </template>
      <template v-else-if="$route.name === 'georeference'">
        <Georeference :image="image" />
      </template>
      <template v-else-if="$route.name === 'results'">
        <Results :image="image" />
      </template>
      <template v-else>
        <Home class="padding" />
      </template>
    </main>
    <Drawer v-if="$route.name !== 'home'"
      :images="images"
      :activeImageId="activeImageId" />
    <Sidebar />
  </div>
</template>

<style src='ol/ol.css'></style>
<style src='highlight.js/styles/sunburst.css'></style>

<script>
import { mapState, mapActions } from 'vuex'

import Header from './components/Header.vue'
import Drawer from './components/Drawer.vue'
import Sidebar from './components/Sidebar.vue'

import Home from './components/Home.vue'
import Collection from './components/Collection.vue'
import Georeference from './components/Georeference.vue'
import PixelMask from './components/PixelMask.vue'
import Results from './components/Results.vue'

const WS_API_URL = process.env.VUE_APP_WS_API_URL
import ReconnectingWebSocket from 'reconnecting-websocket'
import ShareDB from 'sharedb/lib/client'
const json1 = require('ot-json1')

import { parseOperations } from './lib/json1-operations'
import { getIIIF } from './lib/iiif'

const serverUrl = process.env.VUE_APP_SERVER_URL

export default {
  name: 'app',
  components: {
    Header,
    Drawer,
    Sidebar,
    Home,
    Collection,
    Georeference,
    PixelMask,
    Results
  },
  data () {
    return {
      iiifType: undefined,
      manifest: undefined,

      images: {},
      sortedImageIds: [],

      error: undefined,

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

    ...mapActions('iiif', [
      'setIiifUrl'
    ]),

    initializeDoc: function () {
      const source = 'ShareDB'

      let message
      if (!this.doc.version) {
        this.doc.create({}, json1.type.name)
        message = 'You’re editing a new map.'
      } else {
        message = 'Someone has started georeferencing this map, you can continue editing to improve their work.'
      }

      message += ' All edits are automatically saved in the Allmaps database.'

      this.$buefy.snackbar.open({
        message,
        position: 'is-top'
      })

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
        console.error(err)
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
      this.$router.push({ name, query: this.$route.query })
    },
    updateIiif: async function (url) {
      const { type, manifest, images } = await getIIIF(url)

      this.iiifType = type
      this.manifest = manifest
      this.images = images

      this.sortedImageIds = Object.values(this.images)
        .map(({id, index}) => ({id, index}))
        .sort((a, b) => a.index - b.index)

      if (this.$route.query.image) {
        this.setActiveImageId({ imageId: this.$route.query.image })
      } else {
        this.setActiveImageId({ imageId: this.sortedImageIds[0].id })
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
      }
    }
  },
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      maps: (state) => state.maps.maps
    }),
    fullscreen: function () {
      return this.$route.name === 'mask' || this.$route.name === 'georeference' || this.$route.name === 'results'
    },
    image: function () {
      return this.images[this.activeImageId]
    }
  },
  watch: {
    '$route.query.url': function (url) {
      this.setIiifUrl(url)
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
    const url = this.$route.query.url

    if (url) {
      this.setIiifUrl(url)
      this.updateIiif(url)
    }

    window.addEventListener('keypress', this.keyPressHandler)

    this.rws = new ReconnectingWebSocket(WS_API_URL)
    ShareDB.types.register(json1.type)
    this.connection = new ShareDB.Connection(this.rws)

    this.storeUnsubscribe = this.$store.subscribe(this.onStoreMutation)
  },
  beforeDestroy: function () {
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
@import './assets/base.scss';

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
  padding: 0.5em;
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

  color: var(--black);
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

button, input {
  font-size: 100%;
}

header, footer,
a, a:visited {
  color: #2c3e50;
}

/* button {
  border: none;
  display: inline-block;
  cursor: pointer;
  background-color: white;
  text-decoration: underline;
  padding: .25em;
  display: inline-block;
  line-height: 1;
} */

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
</style>
