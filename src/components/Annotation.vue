<template>
  <pre v-highlightjs="annotation"><code class="json"></code></pre>
  <!-- <div><div class="json">{{ annotation }}</div></div> -->
</template>

<script>
import {createAnnotation} from '../lib/annotation'
import georeference from '../lib/api'

export default {
  name: 'Annotation',
  props: {
    iiif: Object,
    georeferenceData: Array,
    maskData: Array,
  },
  data: function () {
    return {
      apiData: undefined
    }
  },
  watch: {
    georeferenceData: function () {
      this.callApi()
    },
    maskData: function () {
      this.callApi()
    }
  },
  computed: {
    annotation: function () {
      const annotation = createAnnotation(this.iiif, this.georeferenceData, this.maskData, this.apiData)
      return JSON.stringify(annotation, null, 2)
    }
  },
  methods: {
    callApi: async function () {
      if (this.georeferenceData && this.maskData) {
        const data = await georeference(this.iiif, this.georeferenceData, this.maskData)
        this.apiData = data
      }
    },
    createAnnotation
  },
  mounted: function () {
    this.callApi()
  }
}
</script>

<style scoped>
pre {
  background-color: black;
  margin: 0;
  white-space: pre-wrap;
}

code {
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>
