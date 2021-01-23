<template>
  <!-- TODO: codemirror!!! -->
  <pre v-highlightjs="annotationString"><code class="json" /></pre>
</template>

<script>
export default {
  name: 'Annotation',
  props: {
    annotation: {type:Object, default:null},
    image: {type:Object, default:null}
  },
  computed: {
    annotationString: function () {
      return JSON.stringify(this.annotation, null, 2)
    }
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
