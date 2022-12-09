<template>
  <li v-if="parsedCorrectly">
    <router-link
      :to="{
        name: 'collection',
        query: {
          url: example.url
        }
      }"
    >
      <Thumbnail
        :image="parsedImage"
        @fetch-embedded="fetchImage"
        @error="onError"
        @hond="hond"
      />
      <!-- <img :src="imageUrl" /> -->
    </router-link>
    <div class="links">
      <div>
        <div class="resource-title">
          <strong :title="example.title">{{ example.title }}</strong>
        </div>
        <div>
          From:
          <em
            ><a :href="example.collection.url">{{
              example.collection.title
            }}</a></em
          >
        </div>
      </div>
      <div>
        <router-link
          :to="{
            name: 'collection',
            query: {
              url: example.url
            }
          }"
        >
          Georeference this IIIF resource</router-link
        > →
      </div>
    </div>
  </li>
</template>

<script>
import Thumbnail from './Thumbnail.vue'

import { IIIF, Image } from '@allmaps/iiif-parser'

import { fetchJson } from '../lib/api.js'

export default {
  name: 'example',
  components: {
    Thumbnail
  },
  props: {
    example: Object
  },
  data: function () {
    return {
      parsedCorrectly: false,
      parsedImage: undefined,
      imageUrl: undefined
    }
  },
  methods: {
    fetchImage: async function () {
      try {
        const url = `${this.parsedImage.uri}/info.json`
        const iiifData = await fetchJson(url)
        const parsedImage = Image.parse(iiifData)
        this.parsedImage = parsedImage
      } catch (err) {
        this.onError()
      }
    },
    onError: function () {
      this.parsedCorrectly = false
    }
  },
  mounted: async function () {
    const url = this.example.url

    try {
      const iiifData = await fetchJson(url)
      const parsedIiif = IIIF.parse(iiifData)

      let parsedImage

      if (parsedIiif.type === 'manifest') {
        const firstImage = parsedIiif.canvases[0].image
        parsedImage = firstImage
      } else {
        parsedImage = parsedIiif
      }

      const thumbnail = parsedImage.getThumbnail({ width: 200, height: 200 })
      const imageUrl = parsedImage.getImageUrl(thumbnail)

      this.parsedImage = parsedImage

      this.imageUrl = imageUrl
      this.parsedCorrectly = true
    } catch (err) {
      console.error('Error fetching and parsing example: ', url)
    }
  }
}
</script>

<style scoped>
a {
  text-decoration: underline;
  word-break: normal;
}

li {
  display: flex;
  flex-direction: row;
  gap: 1em;
}

li > a {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  overflow: hidden;
}

.links {
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
  min-width: 0;
}

.resource-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
