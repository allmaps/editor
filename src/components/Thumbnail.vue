<template>
  <div v-if="singleImage" class="single-container">
    <b-skeleton v-if="!loaded" active></b-skeleton>
    <img
      @load="onLoad"
      @error="onError"
      :class="{ single: true, loaded }"
      :src="image.getImageUrl(thumbnail)"
    />
  </div>
  <div
    v-else
    class="tiled"
    :style="{
      gridTemplateColumns: columnPercentages
        .map((percentage) => `${percentage}%`)
        .join(' '),
      aspectRatio: `${tilesWidth} / ${tilesHeight}`,
      left: `${(100 - (tilesWidth / tilesHeight) * 100) / 2}%`
    }"
  >
    <template v-for="(row, rowIndex) in thumbnail">
      <template v-for="(cell, columnIndex) in row">
        <img
          :src="image.getImageUrl(removeHeight(cell))"
          :key="`${columnIndex},${rowIndex}`"
        />
      </template>
    </template>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

import { Image } from '@allmaps/iiif-parser'

export default {
  name: 'Thumbnail',
  data: function () {
    return {
      loaded: false,
      error: false
    }
  },
  props: {
    image: Image,
    imageId: String,
    width: {
      type: Number,
      default: 200 * window.devicePixelRatio
    }
  },
  computed: {
    singleImage: function () {
      return !Array.isArray(this.thumbnail)
    },
    thumbnail: function () {
      return this.image.getThumbnail({
        width: this.width,
        height: this.width
      })
    },
    tilesWidth: function () {
      const firstRow = this.thumbnail[0]
      return firstRow.reduce((acc, row) => acc + row.size.width, 0)
    },
    tilesHeight: function () {
      return this.thumbnail.reduce(
        (acc, cells) => acc + cells[0].size.height,
        0
      )
    },
    columnPercentages: function () {
      const firstRow = this.thumbnail[0]
      return firstRow.map((row) => (row.size.width / this.tilesWidth) * 100)
    }
  },
  methods: {
    ...mapActions('iiif', ['loadImageInfo']),
    removeHeight: function ({ region, size }) {
      return {
        region,
        size: {
          width: size.width
        }
      }
    },
    onLoad: function () {
      this.loaded = true
    },
    onError: function (err) {
      if (this.image.embedded) {
        this.loadImageInfo({ imageId: this.imageId })
      } else {
        // TODO: show error message
        this.error = true
      }
    }
  }
}
</script>

<style scoped>
.single-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.b-skeleton {
  height: 100%;
}

.b-skeleton.is-animated > .b-skeleton-item {
  height: 100%;
}

.single {
  width: 100%;
  height: 100%;
  object-fit: cover;
  visibility: hidden;
  border-radius: 5px;
}

.single.loaded {
  visibility: visible;
}

.tiled {
  display: grid;
  position: relative;
  height: 100%;
}
</style>
