import Vue from 'vue'

import { router } from '../../main.js'

import { generateId } from '@allmaps/id/browser'
import { IIIF, Image } from '@allmaps/iiif-parser'

import { fetchJson, submitIiif } from '../../lib/api.js'

const API_URL = process.env.VUE_APP_API_URL

function getString(value) {
  let strings = []

  if (!value) {
    return
  }

  if (value.none) {
    strings = value.none
  } else if (value.en) {
    strings = value.en
  } else {
    const languages = Object.keys(value)
    const firstLanguage = languages[0]
    strings = value[firstLanguage]
  }

  // TODO: return array, and add multiple elements
  // TODO: create string component that displays multi-lined strings
  return strings.join('\n')
}

const state = () => ({
  loaded: false,
  url: undefined,
  type: undefined,
  id: undefined,
  sourceIiif: undefined,
  parsedIiif: undefined,
  imagesById: {}
})

const getters = {
  manifestId: (state) => {
    return state.parsedIiif && state.parsedIiif.type === 'manifest' && state.id
  },
  imageCount: (state) => {
    return Object.keys(state.imagesById).length
  },
  label: (state) => {
    return state.parsedIiif && getString(state.parsedIiif.label)
  },
  description: (state) => {
    return state.parsedIiif && getString(state.parsedIiif.description)
  },
  metadata: (state) => {
    if (state.parsedIiif) {
      if (state.parsedIiif.metadata && state.parsedIiif.metadata.length) {
        return state.parsedIiif.metadata
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
  async setIiifUrl({ commit, dispatch }, { url, imageId }) {
    if (!url) {
      return
    }

    // TODO: set loading, make sure old images are not displayed
    commit('maps/setMaps', { maps: {} }, { root: true })

    const sourceIiif = await fetchJson(url)
    let parsedIiif = IIIF.parse(sourceIiif)
    const type = parsedIiif.type

    const id = await generateId(parsedIiif.uri)

    let parsedImages
    let apiUrl

    if (type === 'image') {
      parsedImages = [parsedIiif]
      apiUrl = `${API_URL}/images/${id}`
    } else if (type === 'manifest') {
      parsedImages = parsedIiif.canvases.map((canvas) => canvas.image)
      apiUrl = `${API_URL}/manifests/${id}/maps`
    } else {
      throw new Error(`Unsupported IIIF type: ${type}`)
    }

    submitIiif(url, type, id, sourceIiif)

    // Wait for API for precess new IIIF URL
    setTimeout(() => {
      dispatch('api/fetchMaps', { url: apiUrl }, {root: true})
    }, 2000)

    let imageIds = []
    for (let parsedImage of parsedImages) {
      const imageId = await generateId(parsedImage.uri)
      imageIds.push(imageId)
    }

    const imagesById = parsedImages.reduce((imagesById, parsedImage, index) => {
      const imageId = imageIds[index]

      return {
        ...imagesById,
        [imageId]: {
          parsedImage,
          imageId,
          index,
          previousImageId: imageIds[index - 1],
          nextImageId: imageIds[index + 1]
        }
      }
    }, {})

    if (type === 'image') {
      const imageId = imageIds[0]
      imagesById[imageId].sourceIiif = sourceIiif
    }

    commit('setIiif', { url, type, id, sourceIiif, parsedIiif, imagesById })

    let newRoute
    let newImageId

    if (imageId && imagesById[imageId]) {
      newImageId = imageId
    } else {
      newImageId = imageIds[0]

      newRoute = {
        name: router.currentRoute.name,
        query: {
          ...router.currentRoute.query,
          image: newImageId
        }
      }
    }

    if (imagesById[newImageId].parsedImage.embedded) {
      await dispatch('loadImageInfo', { imageId: newImageId })
    }

    if (newRoute) {
      router.push(newRoute)
    }

    commit('ui/setActiveImageId', { imageId: newImageId }, { root: true })
  },
  async loadImageInfo({ state, commit }, { imageId }) {
    if (
      state.imagesById[imageId] &&
      state.imagesById[imageId].parsedImage.embedded
    ) {
      const imageUri = state.imagesById[imageId].parsedImage.uri
      const url = `${imageUri}/info.json`
      const sourceIiif = await fetchJson(url)
      let parsedImage = Image.parse(sourceIiif)

      const type = parsedImage.type
      if (type === 'image') {
        if (imageUri === parsedImage.uri) {
          const currentImage = state.imagesById[imageId]

          const image = {
            ...currentImage,
            parsedImage,
            sourceIiif
          }

          commit('setImage', { imageId, image })
        } else {
          const error = new Error(`Image IDs don't match`)
          error.name = 'ImageIDMismatchError'
          error.details = {
            imageUri: parsedImage.uri,
            embeddedImageUri: imageUri
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
  setIiif(state, { url, type, id, sourceIiif, parsedIiif, imagesById }) {
    state.loaded = true
    state.url = url
    state.type = type
    state.id = id
    state.sourceIiif = sourceIiif
    state.parsedIiif = parsedIiif
    state.imagesById = imagesById
  },

  setImage(state, { imageId, image }) {
    Vue.set(state.imagesById, imageId, image)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
