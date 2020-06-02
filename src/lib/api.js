import axios from 'axios'

const apiUrl = 'https://georectify-service-q26jk7mh3q-uc.a.run.app'

export default function georeference (iiif, gcps, mask) {
  const data = apiData(iiif, gcps, mask)
console.log(data)
  const url = `${apiUrl}/json/geojson`

  return axios.post(url, data)
    .then((response) => response.data)
}

function apiData (iiif, gcps, mask) {
  const url = iiif && iiif.manifestUrl

  const dimensions = iiif && iiif.imageInfo &&
    [iiif.imageInfo.width, iiif.imageInfo.height]

  return {
    sources: [{
      type: 'iiif',
      url,
      dimensions
    }],
    maps: [
      {
        mask: mask.map((point) => ([
          point[0] / dimensions[0],
          point[1] / dimensions[1]
        ])),
        gcps: gcps.map(({pixel, world}) => ({
          image: ([
            pixel[0] / dimensions[0],
            pixel[1] / dimensions[1]
          ]),
          world: [world[1], world[0]]
        }))
      }
    ]
  }
}
