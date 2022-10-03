<template>
  <div class="background section">
    <div class="container content">
      <div v-if="viewerUrls.length">
        <p>
          Results page coming soon. For now, you can view georeferenced maps in
          Allmaps Viewer:
        </p>
        <ul>
          <li v-for="({ label, url }, index) in viewerUrls" :key="index">
            <a :href="url">{{ label }}</a>
          </li>
        </ul>
        <template v-if="activeMapId">
        <p>
          To view this map in GIS software that supports XYZ map tiles, you can
          use
          <a href="https://observablehq.com/@bertspaan/allmaps-tile-server"
            >Allmaps Tile Server</a
          >
          and copy the following template URL:
        </p>
        <ul>
          <li>
            <code
              >https://allmaps.xyz/maps/{{ activeMapId }}/{z}/{x}/{y}.png</code
            >
          </li>
        </ul>
        </template>
      </div>
      <div v-else>
        To view the results on a map, georeference one or more image.
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

const VIEWER_URL = process.env.VUE_APP_VIEWER_URL
const ANNOTATIONS_URL = process.env.VUE_APP_ANNOTATIONS_URL

export default {
  name: 'Results',
  computed: {
    ...mapGetters('iiif', {
      manifestId: 'manifestId'
    }),
    ...mapGetters('maps', {
      mapsByImageId: 'mapsByImageId',
      previousMapsByImageId: 'previousMapsByImageId'
    }),
    ...mapState({
      activeMapId: (state) => state.ui.activeMapId,
      activeImageId: (state) => state.ui.activeImageId,
      apiMapsByImageId: (state) => state.api.mapsByImageId
    }),
    allMapsByImageId: function () {
      return {
        ...this.apiMapsByImageId,
        ...this.previousMapsByImageId,
        ...this.mapsByImageId
      }
    },
    mapCountInManifest: function () {
      return Object.values(this.allMapsByImageId).flat().length
    },
    mapCountInImage: function () {
      return Object.values(this.mapsByImageId).flat().length
    },
    mapCountInMap: function () {
      return Object.values(this.mapsByImageId)
        .flat()
        .filter((map) => map.id === this.activeMapId).length
    },
    viewerUrls: function () {
      let viewerUrls = []

      const viewerBaseUrl = `${VIEWER_URL}/#?image=${this.activeImageId}&map=${this.activeMapId}&type=annotation&data=data:text/x-url,`
      const annotationBaseUrl = ANNOTATIONS_URL

      if (this.manifestId && this.mapCountInManifest) {
        // TODO: check if manifest contains valid maps
        const annotationUrl = `${annotationBaseUrl}/manifests/${this.manifestId}`
        const viewerUrl = `${viewerBaseUrl}${encodeURIComponent(annotationUrl)}`
        viewerUrls.push({
          label: 'View all maps in collection',
          url: viewerUrl
        })
      }

      if (this.activeImageId && this.mapCountInImage) {
        const annotationUrl = `${annotationBaseUrl}/images/${this.activeImageId}`
        const viewerUrl = `${viewerBaseUrl}${encodeURIComponent(annotationUrl)}`
        viewerUrls.push({ label: 'View current image', url: viewerUrl })
      }

      if (this.activeMapId && this.mapCountInImage > 1 && this.mapCountInMap) {
        const annotationUrl = `${annotationBaseUrl}/maps/${this.activeMapId}`
        const viewerUrl = `${viewerBaseUrl}${encodeURIComponent(annotationUrl)}`
        viewerUrls.push({ label: 'View current map', url: viewerUrl })
      }

      return viewerUrls
    }
  }
}
</script>

<style scoped>
.background {
  background-color: var(--yellow-3);
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.container a,
.container a:visited {
  text-decoration: underline;
  color: black;
}

code {
  background: none;
  color: black;
}
</style>
