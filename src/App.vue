<template>
  <div id="app">
    <Header />
    <div class="contents">
      <Nav v-if="!showHome && !error" />
      <Error v-if="error" />
      <main v-else>
        <template v-if="showHome">
          <Home />
        </template>
        <template v-else-if="$route.name === 'collection'">
          <Collection />
        </template>
        <template v-else-if="$route.name === 'mask'">
          <PixelMask />
        </template>
        <template v-else-if="$route.name === 'georeference'">
          <Georeference />
        </template>
        <template v-else-if="$route.name === 'results'">
          <Results />
        </template>
      </main>
      <Drawer v-if="$route.name !== 'home' && !error" />
      <Sidebar />
    </div>
  </div>
</template>

<style src="ol/ol.css"></style>
<style src="highlight.js/styles/sunburst.css"></style>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import Header from './components/Header.vue'
import Nav from './components/Nav.vue'
import Drawer from './components/Drawer.vue'
import Sidebar from './components/Sidebar.vue'
import Error from './components/Error.vue'

import Home from './components/Home.vue'
import Collection from './components/Collection.vue'
import Georeference from './components/Georeference.vue'
import PixelMask from './components/PixelMask.vue'
import Results from './components/Results.vue'

const WS_API_URL = process.env.VUE_APP_WS_API_URL

import ReconnectingWebSocket from 'reconnecting-websocket'
import ShareDB from 'sharedb/lib/client'
const json1 = require('ot-json1')

import { parseOperations } from './lib/json1-operations.js'

const serverUrl = process.env.VUE_APP_SERVER_URL

export default {
  name: 'app',
  components: {
    Header,
    Nav,
    Drawer,
    Sidebar,
    Error,
    Home,
    Collection,
    Georeference,
    PixelMask,
    Results
  },
  methods: {
    ...mapActions('ui', [
      'setActiveImageId',
      'setActiveMapId',
      'toggleDrawer',
      'setSidebarOpen',
      'setCallback',
      'setProjectsUrl',
      'setUserBaseMapUrl'
    ]),

    ...mapActions('maps', [
      'setMaps',
      'resetMaps',
      'insertMap',
      'removeMap',
      'insertPixelMaskPoint',
      'removePixelMaskPoint',
      'replacePixelMaskPoint',
      'insertGcp',
      'replaceGcp',
      'removeGcp'
    ]),

    ...mapActions('iiif', ['setIiifUrl']),

    ...mapActions('errors', ['setError']),

    initializeDoc: function () {
      if (!this.doc) {
        return
      }

      const source = 'ShareDB'

      if (!this.doc.type) {
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
    },
    getDoc: function () {
      if (this.doc) {
        this.doc.destroy(() => {
          this.setDoc()
        })

        this.doc = undefined
      } else {
        this.setDoc()
      }
    },
    setDoc: function () {
      this.doc = this.connection.get('images', this.activeImageId)

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
                mapId,
                index,
                pixelMaskPoint,
                source
              })
            } else if (pixelMaskPoint) {
              this.insertPixelMaskPoint({
                mapId,
                index,
                pixelMaskPoint,
                source
              })
            } else if (instructions.r) {
              this.removePixelMaskPoint({
                mapId,
                index,
                pixelMaskPoint,
                source
              })
            }
          } else if (type === 'gcps') {
            const gcpId = key
            const gcp = instructions.i

            if (instructions.r && gcp) {
              this.replaceGcp({
                mapId,
                gcpId,
                gcp,
                source
              })
            } else if (gcp) {
              this.insertGcp({
                mapId,
                gcpId,
                gcp,
                source
              })
            } else if (instructions.r) {
              this.removeGcp({
                mapId,
                gcpId,
                source
              })
            }
          }
        })
      }
    },
    onStoreMutation: function (mutation) {
      if (!mutation || !mutation.payload) {
        return
      }

      if (!mutation.type.startsWith('maps/')) {
        return
      }

      if (mutation.payload.source === 'ShareDB') {
        return
      }

      if (mutation.type === 'maps/insertMap') {
        const { mapId, map } = mutation.payload

        // TODO: make map immutable, or use this.doc as store
        this.doc.submitOp(
          json1.insertOp([mapId], JSON.parse(JSON.stringify(map)))
        )
      } else if (mutation.type === 'maps/removeMap') {
        const { mapId } = mutation.payload
        this.doc.submitOp(json1.removeOp([mapId]))
      } else if (mutation.type === 'maps/insertPixelMaskPoint') {
        const { mapId, index, pixelMaskPoint } = mutation.payload
        this.doc.submitOp(
          json1.insertOp([mapId, 'pixelMask', index], pixelMaskPoint)
        )
      } else if (mutation.type === 'maps/removePixelMaskPoint') {
        const { mapId, index, pixelMaskPoint } = mutation.payload
        this.doc.submitOp(
          json1.removeOp([mapId, 'pixelMask', index], pixelMaskPoint)
        )
      } else if (mutation.type === 'maps/replacePixelMaskPoint') {
        const { mapId, index, pixelMaskPoint } = mutation.payload
        // TODO: replace true with oldVal
        this.doc.submitOp(
          json1.replaceOp([mapId, 'pixelMask', index], true, pixelMaskPoint)
        )
      } else if (mutation.type === 'maps/insertGcp') {
        const { mapId, gcpId, gcp } = mutation.payload
        // if (gcp.image && gcp.world) {
        this.doc.submitOp(json1.insertOp([mapId, 'gcps', gcpId], { ...gcp }))
        // }
      } else if (mutation.type === 'maps/replaceGcp') {
        const { mapId, gcpId, gcp } = mutation.payload
        // if (gcp.image && gcp.world) {
        // TODO: replace true with oldVal
        this.doc.submitOp(
          json1.replaceOp([mapId, 'gcps', gcpId], true, { ...gcp })
        )
        // }
      } else if (mutation.type === 'maps/removeGcp') {
        const { mapId, gcpId, gcp } = mutation.payload
        // if (gcp.image && gcp.world) {
        this.doc.submitOp(json1.removeOp([mapId, 'gcps', gcpId]))
        // }
      }
    },
    goToRoute: function (name) {
      this.$router.push({ name, query: this.$route.query })
    },
    keyPressHandler: function (event) {
      const tagName = event.target.tagName.toLowerCase()

      if (tagName === 'input' || tagName === 'textarea') {
        return
      }

      if (event.key === '[') {
        if (!this.activeImage || !this.activeImage.previousImageId) {
          return
        }

        this.$router.push({
          name: this.$route.name,
          query: {
            ...this.$route.query,
            image: this.activeImage.previousImageId,
            map: this.activeMapId
          }
        })
      } else if (event.key === ']') {
        if (!this.activeImage || !this.activeImage.nextImageId) {
          return
        }

        this.$router.push({
          name: this.$route.name,
          query: {
            ...this.$route.query,
            image: this.activeImage.nextImageId
          }
        })
      } else if (event.key === '{') {
        this.setActiveMapId({ mapId: this.previousMapId })
      } else if (event.key === '}') {
        this.setActiveMapId({ mapId: this.nextMapId })
      } else if (event.key === '1') {
        this.goToRoute('collection')
      } else if (event.key === '2') {
        this.goToRoute('mask')
      } else if (event.key === '3') {
        this.goToRoute('georeference')
      } else if (event.key === '4') {
        this.goToRoute('results')
      } else if (event.key === '0') {
        this.goToRoute('home')
      } else if (event.key === 'i') {
        this.toggleDrawer('metadata')
      } else if (event.key === 'm') {
        this.toggleDrawer('maps')
      } else if (event.key === 'a') {
        this.toggleDrawer('annotation')
      }
    },
    newIiifUrl: async function (url) {
      try {
        await this.setIiifUrl({ url, imageId: this.$route.query.image })
      } catch (err) {
        if (err.name === 'SyntaxError') {
          this.setError({
            type: 'json',
            message: err.message
          })
        } else if (err.name === 'TypeError') {
          this.setError({
            type: 'fetch',
            message: err.message
          })
        } else if (err.name === 'ImageIDMismatchError') {
          this.setError({
            type: 'imageIDs',
            message: err.message,
            details: err.details
          })
        } else if (err.name === 'ZodError') {
          this.setError({
            type: 'iiif',
            message: 'Error parsing IIIF data',
            details: err.issues
          })
        } else {
          this.setError({
            type: 'unknown',
            message: err.message
          })
        }
      }
    }
  },
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      activeMapId: (state) => state.ui.activeMapId,
      maps: (state) => state.maps.maps
    }),
    ...mapGetters('ui', {
      activeImage: 'activeImage',
      previousMapId: 'previousMapId',
      nextMapId: 'nextMapId'
    }),
    ...mapGetters('errors', {
      error: 'error'
    }),
    showHome: function () {
      return this.$route.name === 'home' || !this.$route.query.url
    },
    fullscreen: function () {
      return (
        this.$route.name === 'mask' ||
        this.$route.name === 'georeference' ||
        this.$route.name === 'results'
      )
    }
  },
  watch: {
    '$route.name': function () {
      this.setSidebarOpen({ open: false })
    },
    '$route.query.url': function (url) {
      this.setError()
      this.setSidebarOpen({ open: false })
      this.newIiifUrl(url)
    },
    '$route.query.image': function (imageId) {
      if (imageId && this.activeImageId !== imageId) {
        this.setSidebarOpen({ open: false })
        this.setActiveImageId({ imageId })
      }
    },
    '$route.query.map': function (mapId) {
      // TODO maak het
      // if (imageId && this.activeImageId !== imageId) {
      //   this.setSidebarOpen({ open: false })
      //   this.setActiveImageId({ imageId })
      // }
    },
    activeImageId: function () {
      // this.resetMaps()
      this.getDoc()
    }
  },
  mounted: async function () {
    const url = this.$route.query.url

    if (url) {
      this.newIiifUrl(url)
    }

    window.addEventListener('keypress', this.keyPressHandler)

    this.rws = new ReconnectingWebSocket(WS_API_URL)
    ShareDB.types.register(json1.type)
    this.connection = new ShareDB.Connection(this.rws)

    this.storeUnsubscribe = this.$store.subscribe(this.onStoreMutation)

    this.setCallback(this.$route.query.callback)

    // TODO: read projectsUrl from config
    const projectsUrl = 'projects.json'
    this.setProjectsUrl(projectsUrl)

    window.setUserBaseMapUrl = (url) => {
      this.setUserBaseMapUrl(url)
      return 'Done!'
    }
  },
  beforeDestroy: function () {
    window.removeEventListener('keypress', this.keyPressHandler)

    this.storeUnsubscribe()

    if (this.doc) {
      this.doc.removeListener('op', this.remoteOperation)
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

main p a,
main ul a,
main ol a {
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
  /* font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; */
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

.contents {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
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

header,
footer,
a,
a:visited {
  color: #2c3e50;
}
</style>
