import Vue from 'vue'

import { router } from '../../main.js'

import { createId } from '@allmaps/id'
import { parseIiif } from '@allmaps/iiif-parser'

import { fetchJson, submitIiif } from '../../lib/api.js'

function getString (value) {
  if (Array.isArray(value)) {
    // TODO: don't pick first value, return list of values
    return getString(value[0])
  } else if (typeof value === 'object') {
    if (value.en) {
      return getString(value.en)
    } else if (value['@value']) {
      return getString(value['@value'])
    } else {
      return getString(Object.values(value)[0])
    }
  } else if (value && value.includes('<')) {
    let doc = new DOMParser().parseFromString(value, 'text/html')
    return doc.body.textContent || ''
  } else {
    return value
  }
}

const initialState = {
  loaded: false,
  url: undefined,
  type: undefined,
  parsedIiif: undefined,
  imagesById: {},
  imagesByIndex: []
}

const state = () => initialState

const getters = {
  manifestId: (state) => {
    return state.parsedIiif.type === 'manifest' && state.parsedIiif.id
  },
  imageCount: (state) => {
    return state.imagesByIndex.length
  },
  label: (state) => {
    return state.parsedIiif && getString(state.parsedIiif.sourceData.label)
  },
  description: (state) => {
    return state.parsedIiif && getString(state.parsedIiif.sourceData.description)
  },
  metadata: (state) => {
    if (state.parsedIiif) {
      if (state.parsedIiif.sourceData.metadata && state.parsedIiif.sourceData.metadata.length) {
        return state.parsedIiif.sourceData.metadata
          .map(({ label, value }) => ({
            label: getString(label),
            value: getString(value)
          }))
          .filter(({ label, value }) => label && value)
      }
    }
  }
}

const actions = {
  async setIiifUrl ({ commit, dispatch }, { url, imageId }) {
    if (!url) {
      return
    }

    // TODO: set loading, make sure old images are not displayed
    commit('maps/setMaps', { maps: {} }, { root: true })

    const sourceIiif = await fetchJson(url)
    let parsedIiif = parseIiif(sourceIiif)
    const type = parsedIiif.type

    // Add IDs to parsed IIIF data
    parsedIiif.id = await createId(parsedIiif.uri)
    if (type === 'image') {
      parsedIiif.stub = false
    } else if (type === 'manifest') {
      for (let image of parsedIiif.images) {
        image.id = await createId(image.uri)

        // Image data comes from manifest.
        // For each image, we need to download the info.json file.
        // Until then, mark the image as stub.
        // TODO: consider moving this to iiif-parser
        image.stub = true
      }
    } else {
      throw new Error(`Unsupported IIIF type: ${type}`)
    }

    submitIiif(url, parsedIiif.type, parsedIiif.id, sourceIiif)

    const images = type === 'image' ? [parsedIiif] : parsedIiif.images

    commit('setIiif', { url, type, parsedIiif })

    const imagesByIndex = images.map((image, index) => ({
      ...image,
      index,
      previousImageId: images[index - 1] && images[index - 1].id,
      nextImageId: images[index + 1] && images[index + 1].id
    }))

    const imagesById = imagesByIndex.reduce((imagesById, image) => ({
      ...imagesById,
      [image.id]: image
    }), {})

    commit('setImages', { imagesByIndex, imagesById })

    let newRoute
    let newImageId

    if (imageId && imagesById[imageId]) {
      newImageId = imageId
    } else {
      newImageId = images[0].id

      newRoute = {
        name: router.currentRoute.name,
        query: {
          ...router.currentRoute.query,
          image: newImageId
        }
      }
    }

    if (imagesById[newImageId].stub) {
      dispatch('loadImageInfo', { imageId: newImageId })
    }

    if (newRoute) {
      router.push(newRoute)
    }

    commit('ui/setActiveImageId', { imageId: newImageId }, { root: true })

    if (parsedIiif.type === 'manifest') {
      images
        .filter((image) => image.stub)
        .forEach((image) => dispatch('loadImageInfo', { imageId: image.id }))
    }
  },

  async loadImageInfo ({ state, commit }, { imageId }) {
    if (state.imagesById[imageId] && state.imagesById[imageId].stub) {
      const imageStub = state.imagesById[imageId]

      const url = `${imageStub.uri}/info.json`
      const sourceIiif = await fetchJson(url)
      let parsedIiif = parseIiif(sourceIiif)
      const type = parsedIiif.type

      if (type === 'image') {
        const imageIndex = imageStub.index
        // Sometimes, the ID of images in the manifest
        // differ from the ones in the image's info.json.
        // See for example https://iiif.library.utoronto.ca/presentation/v2/mdl:1685/manifest
        // This can happen when URL encoding is not done consistantly.
        const newImageId = await createId(parsedIiif.uri)

        const image = {
          ...parsedIiif,
          stub: false
        }

        let oldImageId = (imageId !== newImageId) && imageId

        // TODO: do we need to delete the old image stub if
        // it has a different ID?
        // commit('deleteImage', { imageId: imageStub.id })
        commit('setImage', { imageIndex, imageId: newImageId, oldImageId, image })
      } else {
        throw new Error(`IIIF data is not an image`)
      }
    }
  }
}

const mutations = {
  setIiif (state, { url, type, parsedIiif }) {
    state.loaded = true
    state.url = url
    state.type = type
    state.parsedIiif = parsedIiif
    state.imagesByIndex = []
    state.imagesById = {}
  },

  setImages (state, { imagesByIndex, imagesById }) {
    state.imagesByIndex = imagesByIndex
    state.imagesById = imagesById
  },

  setImage (state, { imageIndex, imageId, image, oldImageId }) {
    const previousImageIndex = imageIndex - 1
    const nextImageIndex = imageIndex + 1

    let previousImageId
    let nextImageId

    if (previousImageIndex >= 0) {
      previousImageId = state.imagesByIndex[previousImageIndex].id
    }

    if (nextImageIndex < state.imagesByIndex.length) {
      nextImageId = state.imagesByIndex[nextImageIndex].id
    }

    if (state.imagesByIndex[previousImageIndex]) {
      state.imagesByIndex[previousImageIndex].nextImageId = imageId
    }

    if (state.imagesByIndex[nextImageIndex]) {
      state.imagesByIndex[nextImageIndex].previousImageId = imageId
    }

    image.id = imageId
    image.index = imageIndex
    image.previousImageId = previousImageId
    image.nextImageId = nextImageId

    Vue.set(state.imagesByIndex, imageIndex, image)
    Vue.set(state.imagesById, imageId, image)
    Vue.delete(state.imagesById, oldImageId)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
