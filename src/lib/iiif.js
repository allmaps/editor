import axios from 'axios'

function getJson (url) {
  return axios.get(url)
    .then((response) => response.data)
}

export function getManifest (manifestUrl) {
  return getJson(manifestUrl)
}

export function getImageInfo (manifest) {
  const imageId = manifest.sequences[0].canvases[0].images[0].resource.service['@id']
  const imageInfoUrl = `${imageId}/info.json`
  return getJson(imageInfoUrl)
}
