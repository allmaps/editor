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
            <Thumbnail
              :imageId="imageId"
              :image="image.parsedImage"
              @fetch-embedded="onFetchEmbedded"
              @error="onError"
            />
          </router-link>
          <div class="border"></div>
          <div class="icons">
            <img
              alt="Image contains georeferenced map"
              :class="{ present: hasGcps(imageId) }"
              src="../assets/icon-georeferenced.svg"
            />
            <img
              alt="Image contains masked map"
              :class="{ present: hasResourceMask(imageId) }"
              src="../assets/icon-masked.svg"
            />
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

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
    ...mapActions('iiif', ['loadImageInfo']),
    onFetchEmbedded: async function (imageId) {
      if (imageId) {
        this.loadImageInfo({ imageId })
      }
    },
    onError: function () {
      console.error(
        'Error fetching and parsing collection thumbnail: ',
        this.imageId
      )
    },
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
    hasResourceMask: function (imageId) {
      const maps = this.mapsForImageId(imageId)
      return maps.some((map) => map.resourceMask && map.resourceMask.length)
    }
  }
}
</script>

<style scoped>
.background {
  background-color: var(--blue-4);
}

.images {
  list-style-type: none;
  display: grid;

  gap: 10px;
  margin: 10px;

  /* From:
      https://css-tricks.com/an-auto-filling-css-grid-with-max-columns/
  */

  --grid-layout-gap: 10px;
  --grid-column-count: 5;
  --grid-item--min-width: 180px;

  --gap-count: calc(var(--grid-column-count) - 1);
  --total-gap-width: calc(var(--gap-count) * var(--grid-layout-gap));
  --grid-item--max-width: calc(
    (100% - var(--total-gap-width)) / var(--grid-column-count)
  );

  grid-template-columns: repeat(
    auto-fill,
    minmax(max(var(--grid-item--min-width), var(--grid-item--max-width)), 1fr)
  );
}

.images li {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 5px;
  overflow: hidden;
}

.images li .border {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-width: 5px;
  border-color: rgba(255, 255, 255, 0);
  border-style: solid;
  transition: border-color 0.1s;
  border-radius: 5px;
}

.images li.active .border {
  border-color: #48c78e;
  border-style: solid;
  border-width: 5px;
}

.images li a {
  width: 100%;
  height: 100%;
}

.icons {
  position: absolute;
  bottom: 5px;
  height: 2rem;
  padding: 4px;
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
