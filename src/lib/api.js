import axios from 'axios'

// const API_URL = 'https://allmaps.herokuapp.com'
const API_URL = 'http://localhost:8338'

export async function fetchManifest (id) {
  const url = `${API_URL}/manifest/${id}`
  const res = await axios.get(url)
  return res.data
}

export async function fetchImage (id) {
  const url = `${API_URL}/image/${id}`
  const res = await axios.get(url)
  return res.data
}

export async function save (manifest, images, maps) {
  const apiImages = Object.values(images)
    .map((image) => ({
      id: image.id,
      uri: image.uri,
      canvasUri: image.canvasUri,
      width: image.width,
      height: image.height,
      label: image.label,
      iiif: image.iiif,
      maps: Object.values(maps)
        .filter((map) => map.imageId === image.id)
        .map((map) => ({
          id: map.id,
          uri: map.id,
          pixelMask: map.pixelMask,
          gcps: map.gcps,
          geoMask: map.geoMask
        }))
    }))

  let url
  let apiData

  if (manifest) {
    url = `${API_URL}/manifest`
    apiData = {
      id: manifest.id,
      uri: manifest.uri,
      label: manifest.label,
      iiif: manifest.iiif,
      images: apiImages
    }
  } else {
    url = `${API_URL}/image`
    apiData = apiImages[0]
  }

  const res = await axios.post(url, apiData)
  return res.data
}
