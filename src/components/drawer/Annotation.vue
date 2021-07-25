<template>
  <div class="drawer-content">
    <pre v-highlightjs="annotationString"><code class="json"></code></pre>
    <div class="block actions buttons">
      <b-button @click="copy" icon-left="copy">Copy</b-button>
      <b-button @click="download" icon-left="file-download">Download</b-button>

      <a target="_blank" :href="`https://annotations.allmaps.org/images/${activeImageId}`"
        class="button is-link" type="button">
        <span class="icon is-small">
          <i class="fas fa-external-link-alt"></i>
        </span>
        <span>Open in new tab</span>
      </a>

    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { generate } from '@allmaps/annotation'

export default {
  name: 'Annotation',
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      maps: (state) => state.maps.maps
    }),
    ...mapGetters('ui', {
      activeImage: 'activeImage'
    }),
    annotation: function () {
      const maps = Object.values(this.maps)
        .map((map) => {
          return {
            ...map,
            pixelMask: [...map.pixelMask, map.pixelMask[0]],
            gcps: Object.values(map.gcps),
            image: this.getAnnotationImage(map, this.activeImage)
          }
        })

      return generate(maps)
    },
    annotationString: function () {
      return JSON.stringify(this.annotation, null, 2)
    }
  },
  methods: {
    getAnnotationImage: function (map, image) {
      if (map.version === 1) {
        return {
          ...map.image,
          dimensions: undefined,
          width: image.width,
          height: image.height,
          quality: image.quality,
          format: image.format,
          version: image.version
        }
      } else {
        return map
      }
    },
    copy: function () {
      navigator.clipboard.writeText(this.annotationString)

      this.$buefy.toast.open({
        message: 'Annotation copied to clipboard!',
        type: 'is-success'
      })
    },
    download: function () {
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
  border-radius: 0.5em;
  /* height: 400px; */
  overflow: auto;
  margin-bottom: 0.5em;
}

code {
  height: 100%;
  width: 100%;
  padding: 0.5rem;
}

.actions {
  flex-shrink: 0;
}
</style>
