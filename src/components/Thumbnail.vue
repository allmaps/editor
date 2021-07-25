<template>
  <img v-if="singleImage" class="single" :src="getImageUrl(image, thumbnail)"/>
  <div v-else class="tiled" :style="{
    width: `${tilesWidth * scale}px`,
    height: `${tilesHeight * scale}px`,
    gridTemplateRows: `repeat(${rowCount}, auto)`,
    gridTemplateColumns: `repeat(${columnCount}, auto)`
  }">
    <template v-for="(row, rowIndex) in thumbnail">
      <template v-for="(cell, columnIndex) in row">
        <img :src="getImageUrl(image, removeHeight(cell))"
          :style="{
            width: `${cell.size.width * scale}px`
          }"
          :key="`${columnIndex},${rowIndex}`" />
      </template>
    </template>
  </div>
</template>

<script>

import { getThumbnail, getImageUrl } from '@allmaps/iiif-parser'

export default {
  name: 'Thumbnail',
  props: {
    image: Object,
    width: {
      type: Number,
      default: 200
    }
  },
  computed: {
    singleImage: function () {
      return !Array.isArray(this.thumbnail)
    },
    thumbnail: function () {
      return getThumbnail(this.image, this.width)
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
      return this.thumbnail.reduce((acc, cells) => acc + cells[0].size.height, 0)
    },
    scale: function () {
      return this.width / Math.max(this.tilesWidth, this.tilesHeight)
    }
  },
  methods: {
    getImageUrl,
    getThumbnail,
    removeHeight: function ({ region, size }) {
      return {
        region,
        size: {
          width: size.width
        }
      }
    }
  }
}
</script>

<style scoped>
img.single {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tiled {
  display: grid;
}

/*
.images li img.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-height: 100%;
  min-width: 100%;
  object-fit: cover;
  vertical-align: bottom;
} */
</style>