<template>
  <div v-if="singleImage" class="single-container">
    <b-skeleton v-if="!loaded" active :height="`${200}px`"></b-skeleton>
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
      width: `${tilesWidth * scale}px`,
      height: `${tilesHeight * scale}px`,
      gridTemplateRows: `repeat(${rowCount}, max-content)`,
      gridTemplateColumns: `repeat(${columnCount}, max-content)`
    }"
  >
    <template v-for="(row, rowIndex) in thumbnail">
      <template v-for="(cell, columnIndex) in row">
        <img
          :src="image.getImageUrl(removeHeight(cell))"
          :style="{
            width: `${cell.size.width * scale}px`
          }"
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
    rowCount: function () {
      return this.thumbnail.length
    },
    columnCount: function () {
      const firstRow = this.thumbnail[0]
      return firstRow.length
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
    scale: function () {
      return (
        this.width /
        Math.min(this.tilesWidth, this.tilesHeight) /
        window.devicePixelRatio
      )
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
      if (this.image.constructor.name === 'EmbeddedImage') {
        this.loadImageInfo({ imageId: this.imageId })
      } else {
        this.error = true
      }
    },


  }
}
</script>

<style scoped>
.single-container {
  width: 100%;
  height: 100%;
}

.single {
  width: 100%;
  height: 100%;
  object-fit: cover;
  visibility: hidden;
}

.single.loaded {
  visibility: visible;
}

.tiled {
  display: grid;
  overflow: hidden;
  justify-content: center;
  align-content: center;
}
</style>
