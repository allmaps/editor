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
          >
            <template v-if="!image.stub">
              <Thumbnail v-if="!image.stub" :image="image.parsedImage" />
              <!-- TODO: add label, or index -->
              <!-- <span v-if="image.label">{{ image.label }}</span> -->
            </template>
            <template v-else>
              <div>
                <b-icon
                  pack="fas"
                  icon="sync-alt"
                  size="is-large"
                  custom-class="fa-spin"
                />
              </div>
            </template>
          </router-link>
          <div class="icons">
            <!-- <img :class="{present: hasGcps(id)}" src="../assets/icon-georeferenced.svg" /> -->
            <!-- <img :class="{present: hasPixelMask(id)}" src="../assets/icon-masked.svg" /> -->
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<script>
import { mapState } from 'vuex'

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
      activeImageId: (state) => state.ui.activeImageId
    })
  },
  methods: {
    handleSubmit() {
      this.$router.push({
        name: this.$route.name,
        query: {
          url: this.inputUrl
        }
      })
    },
    mapsForImage: function (imageId) {
      return Object.values(this.maps).filter((map) => map.imageId === imageId)
    },
    hasGcps: function (imageId) {
      const maps = this.mapsForImage(imageId)
      return maps.some((map) => map.gcps && Object.keys(map.gcps).length)
    },
    hasPixelMask: function (imageId) {
      const maps = this.mapsForImage(imageId)
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
  border-width: 3px;
  border-color: white;
  border-style: solid;
  transition: border-color 0.08s;
}

/* li:last-child {
  flex-grow: 10;
} */

/* .images li::before {
  content: "";
  padding-bottom: 100%;
  display: inline-block;
  vertical-align: top;
} */

.images li.active {
  border-color: #c552b5;
  border-style: solid;
  border-width: 3px;
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
