<template>
  <div v-if="singleImage" class="single-container">
    <b-skeleton v-if="!loaded" active></b-skeleton>
    <img
      v-if="thumbnail"
      @load="onLoad"
      @error="onError"
      :class="{ single: true, loaded }"
      :src="getImageUrl(thumbnail)"
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
        <img :src="getImageUrl(cell)" :key="`${columnIndex},${rowIndex}`" />
      </template>
    </template>
  </div>
</template>

<script>
import { Image } from '@allmaps/iiif-parser'

export default {
  name: 'Thumbnail',
  data: function () {
    return {
      loaded: false,
      thumbnail: undefined
    }
  },
  props: {
    imageId: String,
    image: Image,
    width: {
      type: Number,
      default: 200 * window.devicePixelRatio
    }
  },
  watch: {
    image: function () {
      this.updateThumbnail()
    }
  },
  computed: {
    singleImage: function () {
      return !Array.isArray(this.thumbnail)
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
    updateThumbnail: function () {
      try {
        this.thumbnail = this.image.getThumbnail({
          width: this.width,
          height: this.width
        })
      } catch (err) {
        this.$emit('error', err)
      }
    },
    getImageUrl: function (imageRequest) {
      try {
        return this.image.getImageUrl(imageRequest)
      } catch (err) {
        this.$emit('error', err)
      }
    },
    onLoad: function () {
      this.loaded = true
    },
    onError: function (err) {
      if (this.image.embedded) {
        this.$emit('fetch-embedded', this.imageId)
      } else {
        this.$emit('error')
      }
    }
  },
  mounted: async function () {
    if (this.image.embedded) {
      this.$emit('fetch-embedded', this.imageId)
    } else {
      this.updateThumbnail()
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
