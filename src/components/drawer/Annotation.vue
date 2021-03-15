<template>
  <div class="drawer-content">
    <pre v-highlightjs="annotationString"><code class="json"></code></pre>
    <div class="block actions buttons">
      <b-button @click="copy">Copy to clipboard</b-button>
      <b-button @click="download">Download</b-button>
      <a class="button" target="_blank" :href="`https://annotations.allmaps.org/images/${activeImageId}`">Open in new tab</a>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

import { generate } from '@allmaps/annotation'

export default {
  name: 'Annotation',
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
    }
  },
  methods: {
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
