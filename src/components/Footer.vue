<template>
  <footer class="padding">
    <div>
      <div v-if="selectedImage && imageCount > 1" class="menu">
        <template v-if="selectedImage.previousImageId">
          <router-link :to="{
            name: $route.name,
            query: {
              url: $route.query.url,
              image: selectedImage.previousImageId
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
          }}">Image {{ selectedImage.index + 1}}/{{ imageCount }}</router-link>
        </span>
        <template v-if="selectedImage.nextImageId">
          <router-link :to="{
            name: $route.name,
            query: {
              url: $route.query.url,
              image: selectedImage.nextImageId
            }}">Next</router-link>
        </template>
        <template v-else>
          <span>Next</span>
        </template>
      </div>
    </div>
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
  name: 'Footer',
  props: {
    showAnnotation: Boolean,
    images: Object,
    selectedImageId: String
  },
  computed: {
    imageCount: function () {
      return Object.keys(this.images).length
    },
    selectedImage: function () {
      return this.images[this.selectedImageId]
    },
    hasToken: function () {
      return true || this.$route.query.token
    }
  }
}
</script>

<style scoped>
footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.menu > * {
  margin-right: .5em;
}

.menu button {
  padding: .5em;
  margin: 0;
}
</style>
