const state = () => ({
  showAnnotation: false,
  lastError: undefined,
  activeImageId: undefined,
  activeMapId: undefined
})

const getters = {

}

const actions = {
  setActiveImageId ({ state, commit, rootState, rootGetters }, imageId) {
    commit('setActiveImageId', imageId)

    const maps = rootGetters['maps/mapsForActiveImage']
    if (Object.keys(maps).length) {
      // TODO: get first map, maybe add property?
      const mapId = Object.keys(maps)[0]
      commit('setActiveMapId', mapId)
    }
  },
  setActiveMapId ({ state, commit }, id) {
    commit('setActiveMapId', id)
  }
}

const mutations = {
  setActiveImageId (state, id) {
    state.activeImageId = id
  },
  setActiveMapId (state, id) {
    state.activeMapId = id
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
