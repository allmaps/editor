<template>
  <div class="background">
    <div class="container">
      <div>
        <p>
          Results page coming soon. <span v-if="imageId">
          For now, you can view this map in
          the <a :href="viewerUrl">Allmaps Viewer</a>.
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Results',
  props: {
    image: Object
  },
  computed: {
    imageId: function () {
      return this.image && this.image.id
    },
    viewerUrl: function () {
      const baseUrl = 'https://viewer.allmaps.org/#data=data%3Atext%2Fx-url%2C'
      const annotationUrl = `https://annotations.allmaps.org/images/${this.imageId}`

      return `${baseUrl}${encodeURIComponent(annotationUrl)}`
    }
  }
}
</script>

<style scoped>
.background {
  background-color: var(--yellow-3);
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
