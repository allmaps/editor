import Vue from 'vue'
import Vuex from 'vuex'

import maps from './modules/maps'
import ui from './modules/ui'
import iiif from './modules/iiif'
import api from './modules/api'
import errors from './modules/errors'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    maps,
    ui,
    iiif,
    api,
    errors
  }
})
