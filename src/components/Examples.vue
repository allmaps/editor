<template>
  <section>
    <h3>Examples:</h3>

    <ul class="examples">
      <Example
        v-for="(example, index) in examples"
        :key="index"
        :example="example"
      />
    </ul>
  </section>
</template>

<script>
import Example from './Example.vue'

import { fetchJson } from '../lib/api.js'

const EXAMPLES_COUNT = 15
const collectionsUrl =
  'https://allmaps.org/iiif-map-collections/iiif-map-collections.json'

export default {
  name: 'examples',
  components: {
    Example
  },
  data: function () {
    return {
      examples: []
    }
  },
  mounted: async function () {
    const collections = await fetchJson(collectionsUrl)
    let allExamples = []

    for (let collection of collections) {
      for (let example of collection.examples) {
        allExamples.push({
          ...example,
          collection
        })
      }
    }

    allExamples.sort(() => 0.5 - Math.random())
    this.examples = allExamples.slice(0, EXAMPLES_COUNT)
  }
}
</script>

<style scoped>
ul {
  list-style-type: none;
  margin: 0;
}
</style>
