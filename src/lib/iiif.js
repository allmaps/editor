import axios from 'axios'

import {fetchManifest, fetchImage} from './api'
import {databaseId} from './id'

function getJson (url) {
  return axios.get(url)
    .then((response) => response.data)
}

function toObjectById (arr) {
  return arr.reduce((obj, item) => ({
    ...obj,
    [item.id]: item
  }), {})
}

async function getMapsFromManifestApi (id) {
  try {
    const apiManifest = await fetchManifest(id)

    const maps = apiManifest.images
      .map((apiImage) => apiImage.maps
        .map((map) => ({imageId: apiImage.id, ...map})))
      .flat()

    return toObjectById(maps)
  } catch (err) {
    console.log(`Can't connect to allmaps API`)
  }

  return {}
}

async function getMapsFromImageApi (id) {
  try {
    const apiImage = await fetchImage(id)

    const maps = apiImage.maps
      .map((map) => ({imageId: id, ...map}))

    return toObjectById(maps)
  } catch (err) {
    console.log(`Can't connect to allmaps API`)
  }

  return {}
}

export async function getIIIF (url) {
  const iiifObject = await getJson(url)

  let iiifContext
  if (iiifObject['@context'].constructor === Array) {
    iiifContext = iiifObject['@context'][iiifObject['@context'].length - 1]
  } else {
    iiifContext = iiifObject['@context']
  }

  // TODO: check IIIF Manifest version
  const uri = iiifObject['@id'] || iiifObject['id']

  const id = databaseId(uri)

  if (iiifContext.startsWith('http://iiif.io/api/presentation')) {
    const manifest = iiifObject
    const label = manifest.label

    const maps = await getMapsFromManifestApi(id)

    const iiif = {
      iiifType: 'manifest',
      manifest: {
        id,
        uri,
        label,
        iiif: manifest,
      },
      images: await getImages(manifest, id),
      maps
    }

    return iiif
  } else if (iiifContext.startsWith('http://iiif.io/api/image')) {
    const image = await initializeImage(iiifObject)

    const maps = await getMapsFromImageApi(image.id)

    const iiif = {
      iiifType: 'image',
      manifest: undefined,
      images: {
        [image.id]: image
      },
      maps
    }

    return iiif
  } else {
    throw new Error('Invalid IIIF JSON')
  }
}

export function getManifest (manifestUrl) {
  return getJson(manifestUrl)
}

async function initializeImage (manifestImage, canvas, manifestId) {
  const uri = manifestImage['@id']
  const id = databaseId(uri)

  const image = await getJson(`${uri}/info.json`)

  const canvasUri = canvas && canvas['@id']
  const label = image.label || (canvas && canvas.label)

  const width = image.width || canvas.width
  const height = image.height || canvas.height

  return {
    id,
    manifestId,
    uri,
    canvasUri,
    label,
    width,
    height,
    iiif: image
  }
}

// TODO: make sure to catch errors!
async function getImages (manifest, manifestId) {
  if (manifest.sequences.length !== 1) {
    throw new Error('Only accepts manifest with single sequence')
  }

  const sequence = manifest.sequences[0]
  const canvases = sequence.canvases

  try {
    const images = (await Promise.all(canvases.map(async (canvas) => {
      if (canvas.images.length !== 1) {
        throw new Error('Only accepts canvases with single image')
      }

      const imageAnnotation = canvas.images[0]
      const iiifApiImage = imageAnnotation.resource.service

      const image = await initializeImage(imageAnnotation.resource.service, canvas, manifestId)

      return image
    }))).reduce((imagesObj, image, index, images) => ({
      ...imagesObj,
      [image.id]: {
        ...image,
        index,
        previousImageId: images[index - 1] && images[index - 1].id,
        nextImageId: images[index + 1] && images[index + 1].id
      }
    }), {})

    return images
  } catch (err) {
    console.log(err)
  }
}

export function getDimensions (image) {
  return [image.width, image.height]
}

export function getProfileLevel (profileUri) {
  const match = profileUri.match(/level(?<level>\d+)/)

  if (match && match.groups && match.groups.level) {
    return parseInt(match.groups.level)
  }
}

export function getSizes (image, width = 100) {
  const profile = image.profile

  let profiles
  if (Array.isArray(profile)) {
    profiles = profile
  } else {
    profiles = [profile]
  }

  const anySize = profiles.some((profile, index) => {
    if (index === 0 || typeof profile === 'string') {
      const profileUri = profile
      return getProfileLevel(profileUri) >= 1
    } else {
      const profileUri = profile['@id']
      const supports = profile.supports

      return (supports && supports.includes('sizeByWhListed')) ||
        (profileUri && getProfileLevel(profileUri) >= 1)
    }
  })

  return {
    anySize,
    sizes: image.sizes,
    tiles: image.tiles
  }
}

export function getThumbnailUrls (image, thumbnailWidth = 100) {
  const sizes = getSizes(image)
  const dimensions = getDimensions(image)

  const baseUrl = image['@id']
  const suffix = `0/${getQuality(image)}.${getFormat(image)}`

  if (sizes.anySize) {
    return `${baseUrl}/full/${thumbnailWidth},/${suffix}`
  } else if (sizes.sizes) {
    let currentSizeIndex = 0
    while (currentSizeIndex < sizes.sizes.length && sizes.sizes[currentSizeIndex] < thumbnailWidth) {
      currentSizeIndex++
    }
    const width = sizes.sizes[currentSizeIndex].width
    return `${baseUrl}/full/${width},/${suffix}`
  } else if (sizes.tiles) {
    const tileSet = sizes.tiles[0]
    const tileWidth = tileSet.width
    const scaleFactor = Math.max(...tileSet.scaleFactors)

    const regionWidth = tileWidth * scaleFactor
    const regionHeight = tileWidth * scaleFactor

    const region = `0,0,${Math.min(dimensions[0], regionWidth)},${Math.min(dimensions[1], regionHeight)}`
    return `${baseUrl}/${region}/${tileWidth},/${suffix}`
  } else {
    throw new Error('Image without sizes, tiles or sizeByWhListed')
  }
}

export function getQuality (image) {
  return 'default'
}

export function getFormat (image) {
  return 'jpg'
}
