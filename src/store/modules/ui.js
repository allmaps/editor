const state = () => ({
  sidebarOpen: false,
  drawerOpen: undefined,
  lastError: undefined,
  activeImageId: undefined,
  activeMapId: undefined,
  loading: false
})

const getters = {
  activeImage: (state, getters, rootState) => {
    return rootState.iiif.imagesById[state.activeImageId]
  },

  previousMapId: (state, getters, rootState) => {
    if (!state.activeMapId) {
      return
    }

    const mapIds = Object.keys(rootState.maps.maps)
    const currentMapIndex = mapIds.indexOf(state.activeMapId)
    const newMapIndex = (currentMapIndex - 1 + mapIds.length) % mapIds.length
    return mapIds[newMapIndex]
  },

  nextMapId: (state, getters, rootState) => {
    if (!state.activeMapId) {
      return
    }

    const mapIds = Object.keys(rootState.maps.maps)
    const currentMapIndex = mapIds.indexOf(state.activeMapId)
    const newMapIndex = (currentMapIndex + 1 + mapIds.length) % mapIds.length
    return mapIds[newMapIndex]
  }
}

const actions = {
  setActiveImageId({ commit, dispatch, rootState }, { imageId }) {
    if (!rootState.iiif.imagesById[imageId]) {
      throw new Error(`Image ID does not exist in IIIF source: ${imageId}`)
    }

    dispatch('maps/resetMaps', { maps: {} }, { root: true })

    if (rootState.iiif.imagesById[imageId].parsedImage.embedded) {
      dispatch('iiif/loadImageInfo', { imageId }, { root: true })
    }

    commit('setActiveImageId', { imageId })
    commit('setActiveMapId', { mapId: undefined })
  },

  setActiveMapId({ commit, rootState }, { mapId }) {
    if (rootState.maps.maps[mapId]) {
      commit('setActiveMapId', { mapId })
    }
  },

  setSidebarOpen({ state, commit }, { open }) {
    if (state.sidebarOpen !== open) {
      commit('setSidebarOpen', { open })
    }
  },

  toggleDrawer({ state, commit }, drawer) {
    const drawerOpen = state.drawerOpen === drawer ? undefined : drawer
    commit('setDrawerOpen', { drawer: drawerOpen })
  }
}

const mutations = {
  setActiveImageId(state, { imageId }) {
    state.activeImageId = imageId
  },
  setActiveMapId(state, { mapId }) {
    state.activeMapId = mapId
  },
  setSidebarOpen(state, { open }) {
    state.sidebarOpen = open
  },
  setDrawerOpen(state, { drawer }) {
    state.drawerOpen = drawer
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
