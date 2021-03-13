import { getIIIF } from '../../lib/iiif'

function getString (value) {
  if (Array.isArray(value)) {
    // TODO: don't pick first value, return list of values
    return getString(value[0])
  } else if (typeof value === 'object' && value['@value']) {
    return getString(value['@value'])
  } else if (value.includes('<')) {
    let doc = new DOMParser().parseFromString(value, 'text/html')
    return doc.body.textContent || ''
  } else {
    return value
  }
}

const state = () => ({
  url: undefined,
  manifest: undefined,
  type: undefined,
  images: {}
})

const getters = {
  sortedImageIds: (state) => {
    return Object.values(state.images)
      .map(({id, index}) => ({id, index}))
      .sort((a, b) => a.index - b.index)
  },
  label: (state) => {
    return state.manifest && getString(state.manifest.iiif.label)
  },
  description: (state) => {
    return state.manifest && getString(state.manifest.iiif.description)
  },
  metadata: (state) => {
    if (state.manifest) {
      return state.manifest.iiif.metadata
        .map(({ label, value }) => ({
          label,
          value: getString(value)
        }))
    }
  }
}

const actions = {
  async setIiifUrl ({ state, commit, rootState }, url) {
    if (!url) {
      return
    }

    const { type, manifest, images } = await getIIIF(url)

    // if (this.$route.query.image) {
    //   this.setActiveImageId({ imageId: this.$route.query.image })
    // } else {
    //   this.setActiveImageId({ imageId: this.sortedImageIds[0].id })
    // }

    commit('setIiif', { url, type, manifest, images })
  }
}

const mutations = {
  setIiif (state, { url, type, manifest, images }) {
    state.url = url
    state.type = type
    state.manifest = manifest
    state.images = images
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
