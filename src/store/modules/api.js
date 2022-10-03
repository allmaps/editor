import { fetchJson } from '../../lib/api.js'

const state = () => ({
  mapsByImageId: {}
})

const getters = {}

const actions = {
  async fetchMaps({ commit }, { url }) {
    const maps = await fetchJson(url)
    commit('setMaps', { maps })
  }
}

const mutations = {
  setMaps(state, { maps }) {
    state.mapsByImageId = {}

    for (let map of maps) {
      const imageId = map.image.id

      if (!state.mapsByImageId[imageId]) {
        state.mapsByImageId[imageId] = []
      }

      state.mapsByImageId[imageId].push(map)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
