import { createStore } from 'vuex'

import maps from './modules/maps'
import ui from './modules/ui'
import iiif from './modules/iiif'

// const debug = process.env.NODE_ENV !== 'production'

export default createStore({
  modules: {
    maps,
    ui,
    iiif
  }
});
