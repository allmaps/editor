/* global DOMParser */

import { router } from '../../main.js'

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

function sortImageIds (images) {
  return Object.values(images)
    .map(({ id, index }) => ({ id, index }))
    .sort((a, b) => a.index - b.index)
}

const state = () => ({
  loaded: false,
  url: undefined,
  manifest: undefined,
  type: undefined,
  images: {},
  sortedImageIds: []
})

const getters = {
  imageCount: (state) => {
    return Object.keys(state.images).length
  },
  sortedImageIds: (state) => {
    return state.sortedImageIds
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
  async setIiifUrl ({ state, commit, rootState }, { url, imageId }) {
    if (!url) {
      return
    }

    const { type, manifest, images } = await getIIIF(url)
    const sortedImageIds = sortImageIds(images)

    commit('maps/setMaps', { maps: {} }, { root: true })
    commit('setIiif', { url, type, manifest, images, sortedImageIds })

    if (imageId && images[imageId]) {
      commit('ui/setActiveImageId', { imageId }, { root: true })
    } else {
      imageId = sortedImageIds[0].id

      const newRoute = {
        name: router.currentRoute.name,
        query: {
          ...router.currentRoute.query,
          image: imageId
        }
      }

      router.push(newRoute)
      commit('ui/setActiveImageId', { imageId: sortedImageIds[0].id }, { root: true })
    }
  }
}

const mutations = {
  setIiif (state, { url, type, manifest, images, sortedImageIds }) {
    state.loaded = true
    state.url = url
    state.type = type
    state.manifest = manifest
    state.images = images
    state.sortedImageIds = sortedImageIds
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
