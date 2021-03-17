<template>
  <div class="background section">
    <div class="container content">
      <div>
        <p class="block">
          Results page coming soon. <span v-if="activeImageId">
          For now, you can view this map in
          the <a :href="viewerUrl">Allmaps Viewer</a>.
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Results',
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId
    }),
    viewerUrl: function () {
      const baseUrl = 'https://viewer.allmaps.org/#data=data%3Atext%2Fx-url%2C'
      const annotationUrl = `https://annotations.allmaps.org/images/${this.activeImageId}`

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
