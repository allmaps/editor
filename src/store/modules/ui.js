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
    return rootState.iiif.images[state.activeImageId]
  }
}

const actions = {
  setActiveImageId ({ state, commit, rootState }, { imageId }) {
    if (!rootState.iiif.images[imageId]) {
      throw new Error(`Image ID does not exist in IIIF source: ${imageId}`)
    }

    commit('setActiveImageId', { imageId })

    const maps = rootState.maps.maps
    if (Object.keys(maps).length) {
      // TODO: get first map, maybe add property?
      const mapId = Object.keys(maps)[0]
      commit('setActiveMapId', { mapId })
    }
  },

  setActiveMapId ({ state, commit, rootState }, { mapId }) {
    if (rootState.maps.maps[mapId]) {
      commit('setActiveMapId', { mapId })
    }
  },

  setSidebarOpen ({ state, commit }, { open }) {
    commit('setSidebarOpen', { open })
  },

  toggleDrawer ({ state, commit }, drawer) {
    const drawerOpen = state.drawerOpen === drawer ? undefined : drawer
    commit('setDrawerOpen', { drawer: drawerOpen })
  }
}

const mutations = {
  setActiveImageId (state, { imageId }) {
    state.activeImageId = imageId
  },
  setActiveMapId (state, { mapId }) {
    state.activeMapId = mapId
  },
  setSidebarOpen (state, { open }) {
    state.sidebarOpen = open
  },
  setDrawerOpen (state, { drawer }) {
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
