<template>
  <pre v-highlightjs="annotation"><code class="json"></code></pre>
</template>

<script>
import {createAnnotation} from '../lib/annotation'

export default {
  name: 'Annotation',
  props: {
    iiif: Object,
    georeferenceData: Array,
    maskData: Array
  },
  computed: {
    annotation: function () {
      const url = this.iiif && this.iiif.manifestUrl
      const annotation = createAnnotation(url, this.georeferenceData, this.maskData)
      return JSON.stringify(annotation, null, 2)
    }
  },
  methods: {
    createAnnotation
  }
}
</script>

<style scoped>
pre {
  background-color: black;
  margin: 0;
  height: 100%;
}

code {
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>
