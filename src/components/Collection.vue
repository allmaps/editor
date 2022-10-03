<template>
  <div class="background">
    <section class="container below-header">
      <ol class="images">
        <li
          v-for="(image, imageId) in imagesById"
          :key="imageId"
          :class="{
            active: activeImageId === imageId
          }"
        >
          <router-link
            :to="{
              name: 'collection',
              query: {
                image: imageId,
                url: $route.query.url
              }
            }"
            @dblclick.native="goToMask(imageId)"
          >
            <Thumbnail :imageId="imageId" :image="image.parsedImage" />
            <!-- TODO: add label, or index -->
            <!-- <span v-if="image.label">{{ image.label }}</span> -->
          </router-link>
          <div class="icons">
            <img
              :class="{ present: hasGcps(imageId) }"
              src="../assets/icon-georeferenced.svg"
            />
            <img
              :class="{ present: hasPixelMask(imageId) }"
              src="../assets/icon-masked.svg"
            />
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Thumbnail from './Thumbnail.vue'

export default {
  name: 'Collection',
  components: {
    Thumbnail
  },
  computed: {
    ...mapState({
      imagesById: (state) => state.iiif.imagesById,
      maps: (state) => state.maps.maps,
      activeImageId: (state) => state.ui.activeImageId,
      iiifUrl: (state) => state.iiif.url,
      apiMapsByImageId: (state) => state.api.mapsByImageId
    }),
    ...mapGetters('maps', {
      mapsByImageId: 'mapsByImageId',
      previousMapsByImageId: 'previousMapsByImageId'
    })
  },
  methods: {
    goToMask(imageId) {
      this.$router.push({
        name: 'mask',
        query: {
          image: imageId,
          url: this.$route.query.url
        }
      })
    },
    handleSubmit() {
      this.$router.push({
        name: this.$route.name,
        query: {
          url: this.inputUrl
        }
      })
    },
    mapsForImageId: function (imageId) {
      const maps =
        this.mapsByImageId[imageId] ||
        this.previousMapsByImageId[imageId] ||
        this.apiMapsByImageId[imageId] ||
        []
      return maps
    },
    hasGcps: function (imageId) {
      const maps = this.mapsForImageId(imageId)
      return maps.some((map) => map.gcps && Object.keys(map.gcps).length)
    },
    hasPixelMask: function (imageId) {
      const maps = this.mapsForImageId(imageId)
      return maps.some((map) => map.pixelMask && map.pixelMask.length)
    }
  }
}
</script>

<style scoped>
.background {
  background-color: var(--blue-4);
}

.images {
  margin: 10px;
  padding: 0;
  list-style-type: none;
  display: flex;
  flex-wrap: wrap;
}

.images::after {
  content: '';
  flex-grow: 10;
}

.images li {
  position: relative;
  margin: 10px;

  width: 200px;
  height: 200px;
  max-width: 200px;

  flex-grow: 1;
  box-sizing: border-box;
  border-width: 5px;
  border-color: rgba(255, 255, 255, 0);
  border-style: solid;
  transition: border-color 0.01s;
}

.images li.active {
  border-color: #48c78e;
  border-style: solid;
  border-width: 5px;
}

.images li a {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icons {
  position: absolute;
  bottom: 0;
  height: 2rem;
  padding: 2px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.icons img {
  width: 32px;
  opacity: 0.15;
}

.icons img.present {
  opacity: 1;
}
</style>
