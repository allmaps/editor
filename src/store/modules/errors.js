const state = () => ({
  error: undefined
})

const getters = {
  error: (state) => {
    return state.error
  }
}

const actions = {
  setError({ commit }, error) {
    commit('setError', { error })
  }
}

const mutations = {
  setError(state, { error }) {
    state.error = error
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
