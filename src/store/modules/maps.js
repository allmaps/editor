import Vue from 'vue'

import { ToastProgrammatic as Toast } from 'buefy'

function makeMapActive (rootState, mapId, commit) {
  if (rootState.ui.activeMapId !== mapId) {
    commit('ui/setActiveMapId', { mapId }, { root: true })
  }
}

function makeOtherMapActive (rootState, mapId, commit) {
  if (rootState.ui.activeMapId !== mapId) {
    return
  }

  let otherMapId
  for (otherMapId of Object.keys(rootState.maps.maps)) {
    if (otherMapId !== mapId) {
      break
    }
  }

  commit('ui/setActiveMapId', { mapId: otherMapId }, { root: true })
}

const state = () => ({
  maps: {}
})

const getters = {
  activeMap: (state, getters, rootState) => {
    const activeMapId = rootState.ui.activeMapId
    const activeMap = state.maps[activeMapId]
    return activeMap
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
  undo () {
    Toast.open({
      message: 'Not yet implemented 😔',
      type: 'is-danger'
    })
  },
  redo () {
    Toast.open({
      message: 'Not yet implemented 😔',
      type: 'is-danger'
    })
  },

  setMaps ({ state, commit, rootState }, { maps, source }) {
    commit('setMaps', { maps, source })

    if (Object.keys(maps).length) {
      const firstMapId = Object.keys(maps)[0]
      if (firstMapId) {
        makeMapActive(rootState, firstMapId, commit)
      }
    }
  },
  insertMap ({ state, commit, rootState }, { mapId, pixelMask = [], gcps = {}, image, source }) {
    const map = {
      version: 1,
      id: mapId,
      image,
      pixelMask,
      gcps
    }

    commit('insertMap', { mapId, map, source })
    makeMapActive(rootState, mapId, commit)
  },

  removeMap ({ state, commit, rootState }, { mapId, source }) {
    makeOtherMapActive(rootState, mapId, commit)
    commit('removeMap', { mapId, source })
  },

  insertPixelMaskPoint ({ state, commit, rootState }, { mapId, index, pixelMaskPoint, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    commit('insertPixelMaskPoint', {
      mapId, index, pixelMaskPoint, source
    })

    makeMapActive(rootState, mapId, commit)
  },

  replacePixelMaskPoint ({ state, commit, rootState }, { mapId, index, pixelMaskPoint, source }) {
    commit('replacePixelMaskPoint', {
      mapId, index, pixelMaskPoint, source
    })

    makeMapActive(rootState, mapId, commit)
  },

  removePixelMaskPoint ({ state, commit, rootState }, { mapId, index, source }) {
    commit('removePixelMaskPoint', {
      mapId, index, source
    })

    makeMapActive(rootState, mapId, commit)
  },

  insertGcp ({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} already exists`)
    }

    commit('insertGcp', {
      mapId, gcpId, gcp, source
    })
  },

  replaceGcp ({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (!state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} does not exist`)
    }

    commit('replaceGcp', {
      mapId, gcpId, gcp, source
    })
  },

  removeGcp ({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (!state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} does not exist`)
    }

    commit('removeGcp', {
      mapId, gcpId, gcp, source
    })
  }
}

const mutations = {
  setMaps (state, { maps }) {
    state.maps = maps
  },

  insertMap (state, { mapId, map }) {
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

  removeMap (state, { mapId }) {
    Vue.delete(state.maps, mapId)

    // In Vue 3:
    // delete state.maps[mapId]
  },

  insertPixelMaskPoint (state, { mapId, index, pixelMaskPoint }) {
    const map = state.maps[mapId]

    const pixelMask = map.pixelMask
    pixelMask.splice(index, 0, pixelMaskPoint)

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  replacePixelMaskPoint (state, { mapId, index, pixelMaskPoint }) {
    const map = state.maps[mapId]
    map.pixelMask[index] = pixelMaskPoint

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  removePixelMaskPoint (state, { mapId, index }) {
    const map = state.maps[mapId]
    map.pixelMask.splice(index, 1)

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  insertGcp (state, { mapId, gcpId, gcp }) {
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

  replaceGcp (state, { mapId, gcpId, gcp }) {
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

  removeGcp (state, { mapId, gcpId }) {
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