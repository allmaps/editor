function gcpsAnnotation (url, gcps) {
  if (gcps) {
    return {
      type: 'Annotation',
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      motivation: 'georeference',
      // label: {
      //   en: [
      //     'Transcription text for this region of the canvas.'
      //   ]
      // },
      // target: manifestUrl,
      body: gcps
    }
  }
}

function maskAnnotation (url, mask) {
  if (mask) {
    return {
      type: 'Annotation',
      motivation: 'mask',
      // label: {
      //   en: [
      //     'Transcription text for this region of the canvas.'
      //   ]
      // },

      // target: manifestUrl,
      // target : '{{ id.path }}/canvas.json#xywh=1300,3370,250,100'
      body: mask
    }
  }
}

export function createAnnotation (url, gcps, mask) {
  return {
    '@id': `https://bertspaan.nl/iiifmaps?url=${url}`,
    type: 'AnnotationPage',
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    items: [
      gcpsAnnotation(url, gcps),
      maskAnnotation(url, mask)
    ].filter((annotation) => annotation)
  }
}
