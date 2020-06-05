function svgSelector (dimensions, mask) {
  const width = dimensions && dimensions[0]
  const height = dimensions && dimensions[1]

  return {
    type: 'SvgSelector',
    value: `<svg width="${width}" height="${height}"><polygon points="${mask.map((point) => point.join(',')).join(' ')}" /></svg>`
  }
}

function createGcpsAnnotation (url, dimensions, gcps) {
  if (gcps) {
    return {
      type: 'Annotation',
      motivation: 'georeference-ground-control-points',
      target: url,
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

function createPixelMaskAnnotation (url, dimensions, mask) {
  if (mask) {
    return {
      type: 'Annotation',
      motivation: 'georeference-pixel-mask',
      target: {
        source: url,
        selector: svgSelector(dimensions, mask)
      },
      body: mask
    }
  }
}

function createGeoMaskAnnotation (url, dimensions, mask, data) {
  if (data) {
    return {
      type: 'Annotation',
      motivation: 'georeference-geo-mask',
      target: {
        source: url,
        selector: svgSelector(dimensions, mask)
      },
      body: data
    }
  }
}

export function createAnnotation (iiif, gcps, pixelMask, geoMask) {
  const url = iiif && iiif.manifestUrl

  const dimensions = iiif && iiif.imageInfo &&
    [iiif.imageInfo.width, iiif.imageInfo.height]

  return {
    '@id': `https://bertspaan.nl/iiifmaps?url=${url}`,
    type: 'AnnotationPage',
    '@context': ['http://geojson.org/geojson-ld/geojson-context.jsonld', 'http://iiif.io/api/presentation/3/context.json'],
    items: [
      createGcpsAnnotation(url, dimensions, gcps),
      createPixelMaskAnnotation(url, dimensions, pixelMask),
      createGeoMaskAnnotation(url, dimensions, pixelMask, geoMask)
    ].filter((annotation) => annotation)
  }
}
