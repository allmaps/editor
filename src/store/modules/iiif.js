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
  imagesById: {}
}

const state = () => initialState

const getters = {
  manifestId: (state) => {
    return state.parsedIiif.type === 'manifest' && state.parsedIiif.id
  },
  imageCount: (state) => {
    return Object.keys(state.imagesById).length
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
    const imagesById = images.reduce((imagesById, image, index) => ({
      ...imagesById,
      [image.id]: {
        ...image,
        index,
        previousImageId: images[index - 1] && images[index - 1].id,
        nextImageId: images[index + 1] && images[index + 1].id
      }
    }), {})

    commit('setIiif', { url, type, parsedIiif, imagesById })

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
      await dispatch('loadImageInfo', { imageId: newImageId })
    }

    if (newRoute) {
      router.push(newRoute)
    }

    commit('ui/setActiveImageId', { imageId: newImageId }, { root: true })

    if (parsedIiif.type === 'manifest') {
      const imageStubs = images.filter(image => image.stub)
      for (let imageStub of imageStubs) {
        await dispatch('loadImageInfo', { imageId: imageStub.id })
      }
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
        // Add ID and previously computed data to parsed IIIF image data
        const parsedImage = {
          ...parsedIiif,
          id: await createId(parsedIiif.uri),
          stub: false,
          index: imageStub.index,
          previousImageId: imageStub.previousImageId,
          nextImageId: imageStub.nextImageId
        }

        if (parsedImage.id === imageId) {
          commit('setImage', { imageId, parsedImage })
        } else {
          const error = new Error(`Image IDs don't match`)
          error.name = 'ImageIDMismatchError'
          error.details = {
            imageUri: parsedIiif.uri,
            inlineImageUri: imageStub.uri
          }

          throw error
        }
      } else {
        throw new Error(`IIIF data is not an image`)
      }
    }
  }
}

const mutations = {
  setIiif (state, { url, type, parsedIiif, imagesById }) {
    state.loaded = true
    state.url = url
    state.type = type
    state.parsedIiif = parsedIiif
    state.imagesById = imagesById
  },

  setImage (state, { imageId, parsedImage }) {
    Vue.set(state.imagesById, imageId, parsedImage)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
