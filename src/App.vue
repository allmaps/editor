<template>
  <div id="app">
    <Header />
    <Separator top />
    <!-- TODO: check ERROR -->
    <main>
      <template v-if="$route.name === 'preview'">
        <Preview
          :image="image"
          :show-annotation="showAnnotation"
        />
      </template>
      <template v-else-if="$route.name === 'mask'">
        <PixelMask
          :bus="bus"
          :image="image"
          :maps="mapsForSelectedImage"
          :last-maps-update-source="lastMapsUpdateSource"
          :selected-map-id="selectedMapId"
          :show-annotation="showAnnotation"
        />
      </template>
      <template v-else-if="$route.name === 'georeference'">
        <Georeference
          :bus="bus"
          :image="image"
          :maps="mapsForSelectedImage"
          :last-maps-update-source="lastMapsUpdateSource"
          :selected-map-id="selectedMapId"
          :show-annotation="showAnnotation"
        />
      </template>
      <template v-else-if="$route.name === 'results'">
        <Results
          :bus="bus"
          :images="images"
          :maps="maps"
          :selected-image-id="selectedImageId"
          :selected-map-id="selectedMapId"
          :show-annotation="showAnnotation"
        />
      </template>
      <template v-else>
        <Home
          class="padding"
          :images="images"
          :maps="maps"
          :sorted-image-ids="sortedImageIds"
          :selected-image-id="selectedImageId"
        />
      </template>
      <transition name="slide">
        <template v-if="showAnnotation">
          <Annotation
            class="annotation"
            :image="image"
            :annotation="annotation"
          />
        </template>
      </transition>
    </main>
    <Separator :top="false" />
    <Footer
      :show-annotation.sync="showAnnotation"
      :images="images"
      :selected-image-id="selectedImageId"
      @copy-annotation="copyAnnotation"
      @download-annotation="downloadAnnotation"
      @save-annotation="saveAnnotation"
    />
  </div>
</template>

<script>
import Vue from "vue"

import Header from "@components/Header.vue"
import Footer from "@components/Footer.vue"
import Separator from "@components/Separator.vue"

import Home from "@components/Home.vue"
import Preview from "@components/Preview.vue"
import Georeference from "@components/Georeference.vue"
import PixelMask from "@components/PixelMask.vue"
import Results from "@components/Results.vue"
import Annotation from "@components/Annotation.vue"

import { getIIIF } from "@lib/iiif"
import { createAnnotation } from "@lib/annotation"
import { save } from "@lib/api"

const createTransformer = require("georeference-js")

export default {
  name: "App",
  components: {
    Header,
    Footer,
    Separator,
    Home,
    Preview,
    Georeference,
    PixelMask,
    Results,
    Annotation,
  },
  data() {
    return {
      iiifType: undefined,
      manifest: undefined,
      images: {},
      maps: {},
      sortedImageIds: [],

      selectedImageId: undefined,
      selectedMapId: undefined,

      bus: new Vue(),
      lastMapsUpdateSource: undefined,

      showAnnotation: false,
      error: undefined,
    }
  },
  computed: {
    annotation: function () {
      return createAnnotation(this.manifest, this.images, this.maps)
    },
    annotationString: function () {
      return JSON.stringify(this.annotation, null, 2)
    },
    image: function () {
      return this.images[this.selectedImageId]
    },
    mapsForSelectedImage: function () {
      return Object.keys(this.maps)
        .filter((id) => this.maps[id].imageId === this.selectedImageId)
        .reduce(
          (maps, id) => ({
            ...maps,
            [id]: this.maps[id],
          }),
          {}
        )
    },
  },
  watch: {
    "$route.query.url": function (url) {
      this.updateIiif(url)
    },
    "$route.query.image": function (imageId) {
      this.selectedImageId = imageId

      const mapsForImage = Object.values(this.maps).filter(
        (map) => map.imageId === imageId
      )
      this.selectedMapId = mapsForImage[0] && mapsForImage[0].id
    },
  },
  created: function () {
    this.bus.$on("maps-update", this.mapsUpdate)
    this.bus.$on("map-delete", this.mapDelete)
    this.bus.$on("map-select", this.mapSelect)
  },
  mounted: async function () {
    if (this.$route.query.url) {
      this.updateIiif(this.$route.query.url)
    }

    window.addEventListener("keypress", this.keyPressHandler)
  },
  beforeDestroy: function () {
    window.removeEventListener("keypress", this.keyPressHandler)
  },
  methods: {
    goToRoute: function (name) {
      this.$router.push({ name, query: this.$route.query })
    },
    mapsUpdate: function ({ source, maps }) {
      this.lastMapsUpdateSource = source

      Object.entries(maps).forEach(([id, map]) => {
        const updatedMap = {
          ...this.maps[id],
          ...map,
        }

        let geoMask
        if (map.gcps || map.pixelMask) {
          geoMask = this.computeGeoMask(updatedMap)
        }

        Vue.set(this.maps, id, {
          id,
          ...updatedMap,
          geoMask,
        })
      })

      const editedMapIds = Object.keys(maps)
      this.selectedMapId = editedMapIds[0]
    },
    mapDelete: function ({ source, id }) {
      this.lastMapsUpdateSource = source
      Vue.delete(this.maps, id)
    },
    mapSelect: function ({ source, id }) {
      this.lastMapsUpdateSource = source
      this.selectedMapId = id
    },
    updateIiif: async function (url) {
      try {
        const { iiifType, manifest, images, maps } = await getIIIF(url)

        this.iiifType = iiifType
        this.manifest = manifest
        this.images = images
        this.lastMapsUpdateSource = undefined
        this.maps = maps

        this.sortedImageIds = Object.values(this.images)
          .map(({ id, index }) => ({ id, index }))
          .sort((a, b) => a.index - b.index)

        if (this.$route.query.image) {
          this.selectedImageId = this.$route.query.image
        } else {
          this.selectedImageId = this.sortedImageIds[0].id
        }

        this.selectedMapId = Object.keys(this.maps)[0]
      } catch (err) {
        // TODO: fix!
        console.error(err)
        this.error = err.message
      }
    },
    computeGeoMask: function (map) {
      if (map.gcps && map.pixelMask) {
        const gcps = {
          type: "FeatureCollection",
          features: map.gcps.map((gcp) => ({
            type: "Feature",
            properties: {
              pixel: gcp.pixel,
            },
            geometry: {
              type: "Point",
              coordinates: gcp.world,
            },
          })),
        }

        try {
          const transformer = createTransformer(gcps)
          const points = transformer.toWorld(map.pixelMask)

          const geoMask = {
            type: "Polygon",
            coordinates: [points.coordinates],
          }

          return geoMask
        } catch (err) {
          // TODO: catch error!
        }
      }
    },
    copyAnnotation: function () {
      navigator.clipboard.writeText(this.annotationString)
    },
    downloadAnnotation: function () {
      const blob = new Blob([this.annotationString], {
        type: "application/json",
      })
      const dataUrl = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      document.body.appendChild(a)
      a.style = "display: none"

      a.href = dataUrl

      // TODO: proper filename
      // image.id
      a.download = "annotation.json"
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
      if (event.key === "[") {
        if (
          !this.images[this.selectedImageId] ||
          !this.images[this.selectedImageId].previousImageId
        ) {
          return
        }

        this.$router.push({
          name: this.$route.name,
          query: {
            ...this.$route.query,
            image: this.images[this.selectedImageId].previousImageId,
          },
        })
      } else if (event.key === "]") {
        if (
          !this.images[this.selectedImageId] ||
          !this.images[this.selectedImageId].nextImageId
        ) {
          return
        }

        this.$router.push({
          name: this.$route.name,
          query: {
            ...this.$route.query,
            image: this.images[this.selectedImageId].nextImageId,
          },
        })
      } else if (event.key === "1") {
        this.goToRoute("home")
      } else if (event.key === "2") {
        this.goToRoute("preview")
      } else if (event.key === "3") {
        this.goToRoute("mask")
      } else if (event.key === "4") {
        this.goToRoute("georeference")
      } else if (event.key === "5") {
        this.goToRoute("results")
      } else if (event.key === "a") {
        this.showAnnotation = !this.showAnnotation
      }
    },
  },
}
</script>


<style src='ol/ol.css'></style>
<style src='highlight.js/styles/sunburst.css'></style>

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

main p a,
main ul a,
main ol a {
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 18px;

  color: #2c3e50;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  min-height: 100%;
}

header,
footer {
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

button,
input {
  font-size: 100%;
}

header,
footer,
a,
a:visited {
  color: #2c3e50;
}

button {
  border: none;
  display: inline-block;
  cursor: pointer;
  background-color: white;
  text-decoration: underline;
  padding: 6px 12px;
}

button.primary {
  border: none;
  background: linear-gradient(to bottom, #007dc1 5%, #0061a7 100%);
  background-color: #007dc1;
  color: #ffffff;
  text-decoration: none;
}

.slide-enter-active,
.slide-leave-active {
  transition: width 0.05s;
}

.slide-enter,
.slide-leave-to {
  width: 0;
}
</style>
