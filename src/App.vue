<template>
  <div id="app">
    <Header />
    <Separator top />
    <main>
      <template v-if="$route.name === 'georeference'">
        <Georeference :iiif="iiif"
          :initialGCPs="gcps" :bus="bus"
          :showAnnotation="showAnnotation" />
      </template>
      <template v-else-if="$route.name === 'mask'">
        <PixelMask :iiif="iiif"
          :initialPixelMask="pixelMask" :bus="bus"
          :showAnnotation="showAnnotation" />
      </template>
      <template v-else-if="$route.name === 'map'">
        <ViewMap :iiif="iiif"
          :gcps="gcps" :geoMask="geoMask"
          :showAnnotation="showAnnotation" />
      </template>
      <template v-else>
        <Home class="padding"
          :iiif="iiif"
          :exampleManifests="exampleManifests" />
      </template>
      <transition name="slide">
        <template v-if="showAnnotation">
          <Annotation class="annotation"
            :annotation="annotation" />
        </template>
      </transition>
    </main>
    <Separator :top="false" />
    <Footer :showAnnotation.sync="showAnnotation" @copyToClipboard="copyToClipboard" />
  </div>
</template>

<style src='ol/ol.css'></style>
<style src='highlight.js/styles/sunburst.css'></style>

<script>
import Vue from 'vue'

import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Separator from './components/Separator.vue'

import Home from './components/Home.vue'
import Georeference from './components/Georeference.vue'
import PixelMask from './components/PixelMask.vue'
import ViewMap from './components/ViewMap.vue'
import Annotation from './components/Annotation.vue'

import {getManifest, getImageInfo, getLabel} from './lib/iiif'

import {createAnnotation} from './lib/annotation'
import connect from './lib/sharedb'
import document from './lib/document'
import georeference from './lib/api'
import {zipWith} from 'ramda'
import {throttle} from 'lodash'

const exampleManifestUrls = require('./lib/example-manifests.json')
const serverUrl = process.env.VUE_APP_SERVER_URL

export default {
  name: 'app',
  components: {
    Header,
    Footer,
    Separator,
    Home,
    Georeference,
    PixelMask,
    ViewMap,
    Annotation
  },
  data () {
    return {
      iiif: undefined,

      connection: undefined,
      documents: undefined,

      bus: new Vue(),

      pixelMask: undefined,
      gcps: undefined,
      geoMask: undefined,

      showAnnotation: false,
      exampleManifestUrls,
      exampleManifests: undefined
    }
  },
  methods: {
    gcpsEdited: function (gcps) {
      this.gcps = gcps
      this.documents.gcps.commit(gcps)
    },
    pixelMaskEdited: function (pixelMask) {
      this.pixelMask = pixelMask
      this.documents.pixelMask.commit(pixelMask)
    },
    pixelMaskReceived: function (pixelMask, source) {
      this.pixelMask = pixelMask
      if (!source) {
        // Operation generated remotely, send new mask to components
        this.bus.$emit('pixel-mask-received', pixelMask)
      }
    },
    gcpsReceived: function (gcps, source) {
      this.gcps = gcps
      if (!source) {
        // Operation generated remotely, send new mask to components
        this.bus.$emit('gcps-received', gcps)
      }
    },
    updateIiif: async function (manifestUrl) {
      const manifest = await getManifest(manifestUrl)
      const imageInfo = await getImageInfo(manifest)

      this.iiif = {
        url: manifestUrl,
        manifest,
        imageInfo
      }

      const id = this.iiif.url

      if (this.documents) {
        for (let key of this.documents) {
          const document = this.documents[key]
          document.destroy()
        }
      }

      this.documents = {
        pixelMask: document(this.connection, 'masks', id, this.pixelMaskReceived),
        gcps: document(this.connection, 'gcps', id, this.gcpsReceived)
      }

    },
    getManifestLabels: async function (manifestUrls) {
      let labels = []

      for (let manifestUrls of manifestUrls) {
        const label = await getLabel(manifestUrls)
        labels.push(label)
      }

      return labels
    },
    throttledCallGeoreferenceApi: throttle(function () {
      this.callGeoreferenceApi()
    }, 2500, {leading: false}),
    callGeoreferenceApi: async function () {
      // TODO: check if API is not called too often!
      if (this.iiif && this.gcps && this.pixelMask) {
        this.geoMask = await georeference(this.iiif, this.gcps, this.pixelMask)
      }
    },
    copyToClipboard: function () {
      const annotation = JSON.stringify(this.annotation, null, 2)
      navigator.clipboard.writeText(annotation)
    }
  },
  computed: {
    annotation: function () {
      return createAnnotation(this.iiif, this.gcps, this.pixelMask, this.geoMask)
    }
  },
  watch: {
    gcps: function () {
      this.throttledCallGeoreferenceApi()
    },
    pixelMask: function () {
      this.throttledCallGeoreferenceApi()
    },
    '$route.query.url': function (url) {
      this.updateIiif(url)
    }
  },
  created: function () {
    this.bus.$on('gcps-edited', this.gcpsEdited)
    this.bus.$on('pixel-mask-edited', this.pixelMaskEdited)
	},
  mounted: async function () {
    if (this.$route.query.url) {
      this.updateIiif(this.$route.query.url)
    }

    this.connection = connect(serverUrl)

    const manifestLabels = await this.getManifestLabels(this.exampleManifestUrls)
    this.exampleManifests = zipWith((url, label) => ({url, label}), this.exampleManifestUrls, manifestLabels)
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

  color: #2c3e50;
  display: flex;
  flex-direction: column;
  width: 100%;
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
  background: linear-gradient(to bottom, #007dc1 5%, #0061a7 100%);
	background-color: #007dc1;
	display: inline-block;
	cursor: pointer;
	color: #ffffff;
	padding: 6px 12px;
	text-decoration: none;
}

.slide-enter-active, .slide-leave-active {
  transition: width .05s;
}

.slide-enter, .slide-leave-to {
  width: 0;
}

</style>
