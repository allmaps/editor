<template>
  <footer class="padding">
    <!-- <div v-if="activeImage && imageCount > 1" class="menu">
      <template v-if="activeImage.previousImageId">
        <router-link :to="{
          name: $route.name,
          query: {
            url: $route.query.url,
            image: activeImage.previousImageId
          }}">Previous</router-link>
      </template>
      <template v-else>
        <span>Previous</span>
      </template>
      <span>
        <router-link :to="{
        name: 'home',
        query: {
          url: $route.query.url,
          image: $route.query.image
        }}">Image {{ activeImage.index + 1}}/{{ imageCount }}</router-link>
      </span>
      <template v-if="activeImage.nextImageId">
        <router-link :to="{
          name: $route.name,
          query: {
            url: $route.query.url,
            image: activeImage.nextImageId
          }}">Next</router-link>
      </template>
      <template v-else>
        <span>Next</span>
      </template>
    </div> -->

    <div class="menu">
      <button @click="$emit('copy-annotation')">Copy</button>
      <button @click="$emit('download-annotation')">Download</button>
      <!-- <button v-if="hasToken" @click="$emit('save-annotation')">Save</button> -->
      <button :style="{
        //width: '150px'
      }" class="primary" @click="$emit('update:showAnnotation', !showAnnotation)">
        {{ showAnnotation ? 'Hide Annotation' : 'Show Annotation' }}
      </button>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Drawer',
  props: {
    images: Object,
    activeImageId: String,
    numClicks: Number
  },
  computed: {
    imageCount: function () {
      return Object.keys(this.images).length
    },
    activeImage: function () {
      return this.images[this.activeImageId]
    },
    hasToken: function () {
      return true || this.$route.query.token
    }
  }
}
</script>

<style scoped>
footer {
  position: absolute;
  z-index: 999;
  bottom: 0;
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;
}

.menu > * {
  margin-right: .5em;
}

.menu button {
  padding: .5em;
  margin: 0;
}
</style>
