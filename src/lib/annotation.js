function gcpsAnnotation (url, dimensions, gcps) {
  if (gcps) {
    return {
      type: 'Annotation',
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      motivation: 'georeference',
      // target: manifestUrl,
      body: {
        type: 'FeatureCollection',
        features: gcps.map((gcp) => ({
          type: 'Feature',
          properties: {
            pixel: gcp.pixel
          },
          geometry: {
            type: 'Point',
            coordinates: gcp.world
          }
        }))
      }
    }
  }
}

function maskAnnotation (url, dimensions, mask) {
  if (mask) {
    const width = dimensions && dimensions[0]
    const height = dimensions && dimensions[1]

    return {
      type: 'Annotation',
      motivation: 'mask',
      target: {
        source: url,
        selector: {
          type: 'SvgSelector',
          value: `<svg width="${width}" height="${height}"><polygon points="${mask.map((point) => point.join(',')).join(' ')}" /></svg>`
        }
      },
      body: mask
    }
  }
}

function apiAnnotation (url, dimensions, data) {
  if (data) {
    return {
      type: 'Annotation',
      motivation: 'geo',
      target: {
        source: url
      },
      body: data
    }
  }
}

export function createAnnotation (iiif, gcps, mask, apiData) {
  const url = iiif && iiif.manifestUrl

  const dimensions = iiif && iiif.imageInfo &&
    [iiif.imageInfo.width, iiif.imageInfo.height]

  return {
    '@id': `https://bertspaan.nl/iiifmaps?url=${url}`,
    type: 'AnnotationPage',
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    items: [
      gcpsAnnotation(url, dimensions, gcps),
      maskAnnotation(url, dimensions, mask),
      apiAnnotation(url, dimensions, apiData)
    ].filter((annotation) => annotation)
  }
}
