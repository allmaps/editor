<template>
  <div class="background section">
    <div class="container content">
      <div>
        <p class="block">
          Results page coming soon.
          <span v-if="activeImageId">
            For now, you can view this map in
            <a :href="viewerUrl">Allmaps Viewer</a>.
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

const VIEWER_URL = process.env.VUE_APP_VIEWER_URL
const ANNOTATIONS_URL = process.env.VUE_APP_ANNOTATIONS_URL

export default {
  name: 'Results',
  computed: {
    ...mapGetters('iiif', {
      manifestId: 'manifestId'
    }),
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId
    }),
    viewerUrl: function () {
      const baseUrl = `${VIEWER_URL}/#type=annotation&data=data:text/x-url,`
      const annotationBaseUrl = ANNOTATIONS_URL

      let annotationUrl
      if (this.manifestId) {
        annotationUrl = `${annotationBaseUrl}/manifests/${this.manifestId}`
      } else {
        annotationUrl = `${annotationBaseUrl}/images/${this.activeImageId}`
      }

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

.container a,
.container a:visited {
  text-decoration: underline;
  color: black;
}
</style>
