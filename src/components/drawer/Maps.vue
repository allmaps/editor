<template>
  <ol class="drawer-content maps" v-if="maps && Object.keys(maps).length">
    <li
      v-for="(map, mapId, index) in maps"
      :key="mapId"
      @click="mapClicked(mapId)"
      :class="{
        active: activeMapId === mapId
      }"
    >
      <div class="map">
        <div class="index">
          <div class="thumbnail">
            <svg v-if="hasPixelMask(map)" :viewBox="thumbnailViewbox(map)">
              <polygon :points="thumbnailPolygonPoints(map)" />
            </svg>
            <span>{{ index + 1 }}</span>
          </div>
          <span>Map {{ index + 1 }}</span>
        </div>
        <b-button
          icon-left="trash"
          class="is-white"
          @click.stop="removeMap({ mapId, source })"
        />
      </div>
      <ol class="gcps" v-if="activeMapId === mapId && hasGcps(map)">
        <li class="gcp" v-for="(gcp, gcpId, index) in map.gcps" :key="gcpId">
          <div class="gcp-data">
            <div class="gcp-icon">
              <span class="circle"></span>
              <span class="index">
                {{ index + 1 }}
              </span>
            </div>
            <span class="gcp-coordinates">
              <template v-if="gcp.image">
                <span class="gcp-image-coordinate">{{
                  printImageCoordinate(gcp.image[0])
                }}</span>
                <span class="gcp-image-coordinate">{{
                  printImageCoordinate(gcp.image[1])
                }}</span>
              </template>
              <template v-else>
                <!-- TODO: create placeholder -->
                <span class="gcp-image-coordinate"></span>
                <span class="gcp-image-coordinate"></span>
              </template>

              <template v-if="gcp.world">
                <span class="gcp-world-coordinate">{{
                  printWorldCoordinate(gcp.world[0])
                }}</span>
                <span class="gcp-world-coordinate">{{
                  printWorldCoordinate(gcp.world[1])
                }}</span>
              </template>
              <template v-else>
                <!-- TODO: create placeholder -->
                <span class="gcp-world-coordinate"></span>
                <span class="gcp-world-coordinate"></span>
              </template>
            </span>
          </div>
          <b-button
            icon-left="trash"
            class="is-white"
            @click.stop="removeGcp({ mapId, gcpId, gcp, source })"
          />
        </li>
      </ol>
    </li>
  </ol>
  <div v-else>Click and drag to draw mask.</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

import { round } from '../../lib/functions'

export default {
  name: 'Maps',
  methods: {
    printImageCoordinate: function (coordinate) {
      return coordinate
    },
    printWorldCoordinate: function (coordinate) {
      return round(coordinate, 5)
    },
    hasPixelMask: function (map) {
      return map && map.pixelMask && map.pixelMask.length > 0
    },
    hasGcps: function (map) {
      return map && map.gcps && Object.keys(map.gcps).length > 0
    },
    maskExtent: function (map) {
      const xs = map.pixelMask.map((point) => point[0])
      const ys = map.pixelMask.map((point) => point[1])

      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)

      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      return [
        [minX, maxX],
        [minY, maxY]
      ]
    },
    maskDimensions: function (map) {
      const maskExtent = this.maskExtent(map)

      return [
        maskExtent[0][1] - maskExtent[0][0],
        maskExtent[1][1] - maskExtent[1][0]
      ]
    },
    thumbnailViewbox: function (map, padding = 5, maxHeight = 50) {
      const maskDimensions = this.maskDimensions(map)
      const scaleFactor = maxHeight / Math.max(...maskDimensions)
      return `${-padding} ${-padding} ${
        maskDimensions[0] * scaleFactor + padding * 2
      } ${maskDimensions[1] * scaleFactor + padding * 2}`
    },
    thumbnailPolygonPoints: function (map, maxHeight = 50) {
      const maskExtent = this.maskExtent(map)
      const maskDimensions = this.maskDimensions(map)
      const scaleFactor = maxHeight / Math.max(...maskDimensions)

      const points = map.pixelMask.map((point) => [
        (point[0] - maskExtent[0][0]) * scaleFactor,
        (point[1] - maskExtent[1][0]) * scaleFactor
      ])

      return points.map((point) => point.join(',')).join(' ')
    },
    ...mapActions('maps', ['removeMap', 'removeGcp']),
    ...mapActions('ui', ['setActiveMapId']),
    mapClicked: function (mapId) {
      this.setActiveMapId({ mapId })
    }
  },
  computed: {
    ...mapState({
      activeMapId: (state) => state.ui.activeMapId,
      maps: (state) => state.maps.maps
    }),
    source: function () {
      return this.$options.name
    }
  }
}
</script>

<style scoped>
ol.maps {
  margin: 0;
  padding: 0;
  list-style-type: none;
  font-size: 75%;
}

ol li {
  cursor: pointer;
}

.map {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map .index {
  display: flex;
  align-items: center;
}

.thumbnail {
  display: inline-block;
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.thumbnail > * {
  position: absolute;
}

.thumbnail span {
  padding: 0.1em;
  background-color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 1em white;
  border-radius: 50%;
  width: 1.1em;
  height: 1.1em;
  text-align: center;
  line-height: 1;
}

.thumbnail svg {
  width: 50px;
  height: 50px;
}

.thumbnail polygon {
  fill: none;
  stroke: black;
  stroke-width: 1px;
}

.active .thumbnail polygon {
  stroke-width: 3px;
}

.gcps {
  list-style-type: none;
  margin-left: 18px;
}

.gcp {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.gcp-data {
  display: flex;
  flex-direction: row;
}

.gcp-icon {
  display: inline-block;
  margin-right: 12px;
}

.gcp .circle {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background-color: red;
}

.gcp .index {
  top: 0.5em;
  position: relative;
}

.gcp .gcp-coordinates {
  display: flex;
  flex-direction: row;
  font-family: monospace;
}

.gcp .gcp-image-coordinate {
  width: 3.5em;
}

.gcp .gcp-world-coordinate {
  width: 6em;
}
</style>
