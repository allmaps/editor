<template>
  <div class="text">
    <p>
      This is a prototype of a IIIF-based map georeferencing tool.
    </p>
    <div v-if="iiif">
      <p>Selected image:</p>
      <img :src="imageUrl" />
    </div>
    <div v-else>
      Select a map image by typing its IIIF manifest URL in the input box, or select one of the example maps from the list below.
    </div>
    <div v-if="exampleManifests">
      <p>
        Example IIIF manifests:
      </p>
      <ul>
        <li v-for="{label, url} in exampleManifests" :key="url">
          <router-link :to="{name: 'home', query: {url}}">
            {{ label }}
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Home',
  props: {
    exampleManifests: Array,
    iiif: Object
  },
  computed: {
    imageUrl: function () {
      const id = this.iiif.imageInfo['@id']
      return `${id}/full/500,/0/default.jpg`
    }
  }
}
</script>

<style scoped>
.text {
  width: 100%;
  position: relative;
}

.text > *:first-child {
  margin-top: 0;
}

img {
  width: 50%;
}
</style>
