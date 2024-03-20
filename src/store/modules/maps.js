import Vue from 'vue'

function makeMapActive(rootState, mapId, commit) {
  if (rootState.ui.activeMapId !== mapId) {
    commit('ui/setActiveMapId', { mapId }, { root: true })
  }
}

function makeOtherMapActive(rootState, mapId, commit) {
  if (rootState.ui.activeMapId !== mapId) {
    return
  }

  let otherMapId
  for (let loopMapId of Object.keys(rootState.maps.maps)) {
    if (loopMapId !== mapId) {
      otherMapId = loopMapId
      break
    }
  }

  commit('ui/setActiveMapId', { mapId: otherMapId }, { root: true })
}

function groupMapsByImageId(mapsByMapId) {
  let mapsByImageId = {}

  for (let map of Object.values(mapsByMapId)) {
    const imageId = map.resource.id

    if (!mapsByImageId[imageId]) {
      mapsByImageId[imageId] = []
    }

    mapsByImageId[imageId].push(map)
  }

  return mapsByImageId
}

const state = () => ({
  maps: {},
  previousMaps: {}
})

const getters = {
  activeMap: (state, getters, rootState) => {
    const activeMapId = rootState.ui.activeMapId
    const activeMap = state.maps[activeMapId]
    return activeMap
  },

  mapsByImageId: (state) => {
    return groupMapsByImageId(state.maps)
  },

  previousMapsByImageId: (state) => {
    return groupMapsByImageId(state.previousMaps)
  }

  // mapsForActiveImage: (state, getters, rootState) => {
  //   const activeImageId = rootState.ui.activeImageId
  //   return Object.keys(state.maps)
  //     .filter((id) => state.maps[id].image.id === activeImageId)
  //     .reduce((maps, id) => ({
  //       ...maps,
  //       [id]: state.maps[id]
  //     }), {})
  // }
}

const actions = {
  setMaps({ commit, rootState }, { maps, source }) {
    commit('setMaps', { maps, source })

    if (Object.keys(maps).length) {
      const firstMapId = Object.keys(maps)[0]
      if (firstMapId) {
        makeMapActive(rootState, firstMapId, commit)
      }
    }
  },

  resetMaps({ dispatch }) {
    dispatch('setMaps', { maps: {} })
  },

  insertMap(
    { commit, rootState },
    { mapId, resourceMask = [], gcps = {}, resource, source }
  ) {
    const map = {
      version: 2,
      id: mapId,
      resource,
      resourceMask,
      gcps
    }

    commit('insertMap', { mapId, map, source })
    makeMapActive(rootState, mapId, commit)
  },

  removeMap({ commit, rootState }, { mapId, source }) {
    makeOtherMapActive(rootState, mapId, commit)
    commit('removeMap', { mapId, source })
  },

  insertResourceMaskPoint(
    { state, commit, rootState },
    { mapId, index, resourceMaskPoint, source }
  ) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    commit('insertResourceMaskPoint', {
      mapId,
      index,
      resourceMaskPoint,
      source
    })

    makeMapActive(rootState, mapId, commit)
  },

  replaceResourceMaskPoint(
    { commit, rootState },
    { mapId, index, resourceMaskPoint, source }
  ) {
    commit('replaceResourceMaskPoint', {
      mapId,
      index,
      resourceMaskPoint,
      source
    })

    makeMapActive(rootState, mapId, commit)
  },

  removeResourceMaskPoint({ commit, rootState }, { mapId, index, source }) {
    commit('removeResourceMaskPoint', {
      mapId,
      index,
      source
    })

    makeMapActive(rootState, mapId, commit)
  },

  insertGcp({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} already exists`)
    }

    commit('insertGcp', {
      mapId,
      gcpId,
      gcp,
      source
    })
  },

  replaceGcp({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (!state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} does not exist`)
    }

    commit('replaceGcp', {
      mapId,
      gcpId,
      gcp,
      source
    })
  },

  removeGcp({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (!state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} does not exist`)
    }

    commit('removeGcp', {
      mapId,
      gcpId,
      gcp,
      source
    })
  }
}

const mutations = {
  setMaps(state, { maps }) {
    state.previousMaps = { ...state.previousMaps, ...state.maps }
    state.maps = maps
  },

  insertMap(state, { mapId, map }) {
    if (!state.maps[mapId]) {
      Vue.set(state.maps, mapId, map)

      // In Vue 3:
      // state.maps = {
      //   ...state.maps,
      //   [mapId]: map
      // }
    } else {
      throw new Error('Map already exists!')
    }
  },

  removeMap(state, { mapId }) {
    Vue.delete(state.maps, mapId)

    // In Vue 3:
    // delete state.maps[mapId]
  },

  insertResourceMaskPoint(state, { mapId, index, resourceMaskPoint }) {
    const map = state.maps[mapId]

    const resourceMask = map.resourceMask
    resourceMask.splice(index, 0, resourceMaskPoint)

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  replaceResourceMaskPoint(state, { mapId, index, resourceMaskPoint }) {
    const map = state.maps[mapId]
    map.resourceMask[index] = resourceMaskPoint

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  removeResourceMaskPoint(state, { mapId, index }) {
    const map = state.maps[mapId]
    map.resourceMask.splice(index, 1)

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  insertGcp(state, { mapId, gcpId, gcp }) {
    const map = state.maps[mapId]

    Vue.set(map.gcps, gcpId, {
      id: gcpId,
      ...gcp
    })

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // map.gcps = {
    //   ...map.gcps,
    //   [gcpId]: {
    //     id: gcpId,
    //     ...gcp
    //   }
    // }

    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  replaceGcp(state, { mapId, gcpId, gcp }) {
    const map = state.maps[mapId]

    Vue.set(map.gcps, gcpId, {
      id: gcpId,
      ...gcp
    })

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // map.gcps = {
    //   ...map.gcps,
    //   [gcpId]: {
    //     id: gcpId,
    //     ...gcp
    //   }
    // }

    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  removeGcp(state, { mapId, gcpId }) {
    const map = state.maps[mapId]

    Vue.delete(map.gcps, gcpId)
    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // delete map.gcps[gcpId]

    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
