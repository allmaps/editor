<template>
  <div class="drawer-content">
    <pre v-highlightjs="annotationString"><code class="json"></code></pre>

    <div class="row">
      <span>Show annotation for:</span>
      <b-field>
        <b-radio-button
          v-if="iiifType !== 'image'"
          v-model="annotationLevel"
          native-value="manifest"
          type="is-primary"
        >
          <span>Manifest</span>
        </b-radio-button>
        <b-radio-button
          v-model="annotationLevel"
          native-value="image"
          type="is-primary"
        >
          <span>Image</span>
        </b-radio-button>
        <b-radio-button
          v-model="annotationLevel"
          native-value="map"
          type="is-primary"
        >
          Map
        </b-radio-button>
      </b-field>
    </div>

    <div class="row">
      <span>Use annotation:</span>

      <div class="block actions buttons">
        <b-button @click="copy" icon-left="copy">Copy</b-button>
        <b-button @click="download" icon-left="file-download"
          >Download</b-button
        >
        <a
          target="_blank"
          :href="annotationUrl"
          class="button is-link"
          type="button"
        >
          <span class="icon is-small">
            <i class="fas fa-external-link-alt"></i>
          </span>
          <span>Open in new tab</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { generateAnnotation } from '@allmaps/annotation'

const ANNOTATIONS_URL = process.env.VUE_APP_ANNOTATIONS_URL

export default {
  name: 'Annotation',
  data: function () {
    return {
      annotationLevel: 'image'
    }
  },
  computed: {
    ...mapState({
      iiifId: (state) => state.iiif.id,
      iiifType: (state) => state.iiif.type,
      activeMapId: (state) => state.ui.activeMapId,
      activeImageId: (state) => state.ui.activeImageId,
      apiMapsByImageId: (state) => state.api.mapsByImageId
    }),
    ...mapGetters('maps', {
      mapsByImageId: 'mapsByImageId',
      previousMapsByImageId: 'previousMapsByImageId'
    }),
    allMapsByImageId: function () {
      return {
        ...this.apiMapsByImageId,
        ...this.previousMapsByImageId,
        ...this.mapsByImageId
      }
    },
    maps: function () {
      let maps = []
      if (this.annotationLevel === 'manifest') {
        maps = Object.values(this.allMapsByImageId).flat()
      } else if (this.annotationLevel === 'image') {
        maps = Object.values(this.mapsByImageId).flat()
      } else if (this.annotationLevel === 'map') {
        maps = Object.values(this.mapsByImageId)
          .flat()
          .filter((map) => map.id === this.activeMapId)
      }

      return maps
    },
    annotation: function () {
      const viewableMaps = this.maps
        .map((map) => ({
          // version: 1,
          ...map,
          gcps: Object.values(map.gcps).filter(
            ({ image, world }) => image && world
          )
        }))
        .filter(this.mapIsViewable)

      return generateAnnotation(viewableMaps)
    },
    annotationString: function () {
      return JSON.stringify(this.annotation, null, 2)
    },
    annotationUrl: function () {
      const annotationBaseUrl = ANNOTATIONS_URL

      if (this.annotationLevel === 'map') {
        return `${annotationBaseUrl}/maps/${this.activeMapId}`
      } else if (this.annotationLevel === 'image') {
        return `${annotationBaseUrl}/images/${this.activeImageId}`
      } else if (this.annotationLevel === 'manifest') {
        return `${annotationBaseUrl}/manifests/${this.iiifId}`
      } else {
        throw new Error(
          `Can't create annotation URL for ${this.annotationLevel}`
        )
      }
    },
    id: function () {
      if (this.annotationLevel === 'map') {
        return this.activeMapId
      } else if (this.annotationLevel === 'image') {
        return this.activeImageId
      } else {
        return this.iiifId
      }
    }
  },
  methods: {
    mapIsViewable: function (map) {
      return map.gcps.length >= 3
    },
    copy: function () {
      navigator.clipboard.writeText(this.annotationString)

      this.$buefy.toast.open({
        message: 'Annotation copied to clipboard!',
        type: 'is-success'
      })
    },
    download: function () {
      const blob = new Blob([this.annotationString], {
        type: 'application/json'
      })
      const dataUrl = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      document.body.appendChild(a)
      a.style = 'display: none'

      a.href = dataUrl

      a.download = `${this.annotationLevel}-${this.id}.georef-annotation.json`
      a.click()
      window.URL.revokeObjectURL(dataUrl)

      this.$buefy.toast.open({
        message: 'Annotation is downloading',
        type: 'is-success'
      })
    }
  }
}
</script>

<style scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
}

pre {
  background-color: black;
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-radius: 0.5em;
  margin-bottom: 0.5em;
  width: 600px;
}

code {
  height: 100%;
  width: 100%;
  padding: 0.5rem;
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.row:not(:last-child) {
  margin-bottom: 0.5em;
}

.actions {
  flex-shrink: 0;
}
</style>
