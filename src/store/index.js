import Vue from 'vue'
import Vuex from 'vuex'

import maps from './modules/maps'
import ui from './modules/ui'
import iiif from './modules/iiif'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    maps,
    ui,
    iiif
  }
})
