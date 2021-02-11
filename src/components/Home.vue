<template>
  <div class="text">
    <div v-if="Object.keys(images).length">
      <ol class="images">
        <li v-for="(image, id) in images" :key="id"
          :class="{
            active: activeImageId === id
          }">
          <router-link :to="{
            name: 'home',
            query: {
              url: $route.query.url,
              image: id
            }}">
            <img class="image" :src="getThumbnailUrls(image.iiif, 250)" />
          </router-link>
          <div class="icons">
            <img :class="{present: hasGcps(id)}" src="../assets/icon-georeferenced.svg" />
            <img :class="{present: hasPixelMask(id)}" src="../assets/icon-masked.svg" />
          </div>
        </li>
      </ol>
    </div>
    <div v-else>
      Select a map image by typing its IIIF manifest or image URL in the input box.
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import { getThumbnailUrls } from '../lib/iiif'

export default {
  name: 'Home',
  props: {
    images: Object,
  },
  computed: {
    ...mapState({
      maps: (state) => state.maps.all,
      activeImageId: (state) => state.ui.activeImageId
    })
  },
  methods: {
    getThumbnailUrls: getThumbnailUrls,
    mapsForImage: function (imageId) {
      return Object.values(this.maps)
        .filter((map) => map.imageId === imageId)
    },
    hasGcps: function (imageId) {
      const maps = this.mapsForImage(imageId)
      return maps.some((map) => map.gcps && map.gcps.length)
    },
    hasPixelMask: function (imageId) {
      const maps = this.mapsForImage(imageId)
      return maps.some((map) => map.pixelMask && map.pixelMask.length)
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

.images {
  margin: 0;
  padding: 0;
  list-style-type: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: 10px;
}

.images li {
  position: relative;
  box-sizing: border-box;
  border-width: 3px;
  border-color: white;
  border-style: solid;
  transition: border-color 0.08s;
}

.images li::before {
  content: "";
  padding-bottom: 100%;
  display: inline-block;
  vertical-align: top;
}

.images li.active {
  border-color: #C552B5;
  border-style: solid;
  border-width: 3px;
}

.images li a {
  width: 100%;
  height: 100%;
}

.images li img.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
