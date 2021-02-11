import Vue from 'vue'

function makeMapActive (rootState, map, commit) {
  if (rootState.ui.activeMapId !== map.id) {
    commit('ui/setActiveMapId', map, { root: true })
  }
}

const state = () => ({
  all: {}
})

const getters = {
  activeMap: (state, getters, rootState) => {
    const activeMapId = rootState.ui.activeMapId
    const activeMap = state.all[activeMapId]
    return activeMap
  },
  mapsForActiveImage: (state, getters, rootState) => {
    const activeImageId = rootState.ui.activeImageId

    return Object.keys(state.all)
      .filter((id) => state.all[id].imageId === activeImageId)
      .reduce((maps, id) => ({
        ...maps,
        [id]: state.all[id]
      }), {})
  }
}

const actions = {
  addMap ({ state, commit, rootState }, map) {
    commit('addMap', map)
    makeMapActive(rootState, map, commit)
  },
  updateMap ({ state, commit, rootState }, map) {
    commit('updateMap', map)
    makeMapActive(rootState, map, commit)
  },
  deleteMap ({ state, commit }, map) {
    commit('deleteMap', map)
    // TODO: make other map active
  }
}

const mutations = {
  addMap (state, map) {
    const id = map.id
    if (!state.all[id]) {
      state.all = {
        ...state.all,
        [id]: map
      }
    } else {
      throw new Error('Map already exists!')
    }
  },

  updateMap (state, map) {
    const id = map.id
    if (state.all[id]) {
      state.all = {
        ...state.all,
        [id]: map
      }
    } else {
      throw new Error('Map not found!')
    }
  },

  // addMaskPoint (state) {

  // }

  // moveMaskPoint (state) {

  // }

  // deleteMaskPoint (state) {

  // }

  // addGcp (state) {

  // }

  // moveGcp (state) {

  // }

  // deleteGcp (state) {

  // }

  deleteMap (state, { id }) {
    Vue.delete(state.all, id)
  }
  // pushProductToCart (state, { id }) {
  //   state.items.push({
  //     id,
  //     quantity: 1
  //   })
  // },

  // incrementItemQuantity (state, { id }) {
  //   const cartItem = state.items.find(item => item.id === id)
  //   cartItem.quantity++
  // },

  // setCartItems (state, { items }) {
  //   state.items = items
  // },

  // setCheckoutStatus (state, status) {
  //   state.checkoutStatus = status
  // }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
