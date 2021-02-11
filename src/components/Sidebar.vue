<template>
  <div class="maps">
    <ol>
      <li v-for="(map, id, index) in maps" :key="id"
        @click="mapClicked(id)" :class="{
          active: activeMapId === id
        }">
        <div class="map">
          <div class="thumbnail">
            <svg v-if="map.pixelMask"
              :viewBox="thumbnailViewbox(map)">
              <polygon
                :points="thumbnailPolygonPoints(map)" />
            </svg>
            <span>{{ index + 1 }}</span>
          </div>
          <button v-if="!showGcps" @click="deleteMapClicked(id)">
            <img alt="Delete map" src="../assets/trash-2.svg" />
          </button>
        </div>
        <ol class="gcps" v-if="showGcps && map.gcps && map.gcps.length">
          <li class="gcp" v-for="(gcp, index) in map.gcps" :key="index">
            <span>{{ index + 1 }}</span>
            <button @click="removeGcp(id, index)">
              <img  alt="Delete GCP" src="../assets/trash-2.svg" />
            </button>
          </li>
        </ol>
      </li>
    </ol>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'

export default {
  name: 'Sidebar',
  props: {
    showGcps: Boolean
  },
  methods: {
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
      return `${-padding} ${-padding} ${maskDimensions[0] * scaleFactor + padding * 2} ${maskDimensions[1] * scaleFactor + padding * 2}`
    },
    thumbnailPolygonPoints: function (map, maxHeight = 50) {
      const maskExtent = this.maskExtent(map)
      const maskDimensions = this.maskDimensions(map)
      const scaleFactor = maxHeight / Math.max(...maskDimensions)

      const points = map.pixelMask.map((point) => ([
        (point[0] - maskExtent[0][0]) * scaleFactor,
        (point[1] - maskExtent[1][0]) * scaleFactor
      ]))

      return points
        .map((point) => point.join(',')).join(' ')
    },
    ...mapActions('maps', [
      'deleteMap'
    ]),
    ...mapActions('ui', [
      'setActiveMapId'
    ]),
    deleteMapClicked: function (id) {
      this.deleteMap({
        source: this.$options.name,
        id
      })
    },
    removeGcp: function (mapId, index) {
      const gcps = [...this.maps[mapId].gcps]
      gcps.splice(index, 1)

      const maps = {
        [mapId]: {
          gcps
        }
      }

      // this.updateMap(map)]
      // this.bus.$emit('maps-update', {
      //   source: this.$options.name,
      //   maps
      // })
    },
    mapClicked: function (id) {
      this.setActiveMapId(id)
    }
  },
  computed: {
    ...mapState({
      activeMapId: (state) => state.ui.activeMapId
    }),
    ...mapGetters('maps', {
      maps: 'mapsForActiveImage'
    }),
  }
}
</script>

<style scoped>
.maps {
  width: 100px;
  flex-shrink: 0;
  flex-grow: 0;
}

.maps > ol {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

.maps li {
  cursor: pointer;
}

.maps li.active {
  background-color: rgba(100, 100, 100, 0.1);
}

.maps .map {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.maps li button {
  background: none;
}

.thumbnail {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail > * {
  position: absolute;
}

.thumbnail span {
  padding: .1em;
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
  margin: 0;
  padding: 0;
}

.gcp {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
</style>
