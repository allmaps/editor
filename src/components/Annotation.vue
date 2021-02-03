<template>
  <pre v-highlightjs="annotationString"><code class="json"></code></pre>
</template>

<script>
export default {
  name: 'Annotation',
  props: {
    annotation: Object,
    image: Object
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
