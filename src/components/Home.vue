<template>
  <div class="text">
    <p>
      This is a prototype of a IIIF-based map georeferencing tool.
    </p>
    <div v-if="exampleManifests">
      <p>
        Some example IIIF manifests:
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
    exampleManifests: Array
  }
}
</script>

<style scoped>
.text {
  width: 100%;
  position: relative;
}
</style>
