export function createAnnotation (manifestUrl, gcps, mask) {
  return {
    type: 'Annotation',
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    '@id': `https://glitch.me/annotation?url=${manifestUrl}`,
    target: manifestUrl,
    body: {
      gcps,
      mask
    }
  }
}
