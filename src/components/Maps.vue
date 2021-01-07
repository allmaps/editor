<template>
  <div class="maps">
    <ol>
      <li v-for="(map, id, index) in maps" :key="id"
        @click="selectMap(id)" :class="{
          selected: selectedMapId === id
        }">
        <div class="header">
          <span>Map {{ index + 1 }}</span>
          <button v-if="!showGcps" @click="removeMap(id)">Delete</button>
        </div>
        <ol v-if="showGcps && map.gcps && map.gcps.length">
          <li v-for="(gcp, index) in map.gcps" :key="index">
            <span>{{ gcp.pixel }} {{ gcp.world }}</span>
            <button @click="removeGcp(id, index)">Delete</button>
          </li>
        </ol>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  name: 'Maps',
  props: {
    maps: Object,
    bus: Object,
    showGcps: Boolean,
    selectedMapId: String
  },
  methods: {
    removeMap: function (id) {
      this.bus.$emit('map-delete', {
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

      this.bus.$emit('maps-update', {
        source: this.$options.name,
        maps
      })
    },
    selectMap: function (id) {
      this.bus.$emit('map-select', {
        source: this.$options.name,
        id
      })
    }
  }
}
</script>

<style scoped>
.maps {
  width: 200px;
}

.maps > ol {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

.maps li {
  cursor: pointer;
}

.maps li.selected {
  background-color: rgba(100, 100, 100, 0.1);
}

.maps .header {
  display: flex;
  justify-content: space-between;
}
</style>
