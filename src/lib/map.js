import { randomId } from './id'

export function createFullImageMap (image) {
  const mapId = randomId()

  const pixelMask = [
    [0, 0],
    [0, image.dimensions[1]],
    image.dimensions,
    [image.dimensions[0], 0]
  ]

  return {
    id: mapId,
    image: {
      id: image.id,
      uri: image.uri,
      dimensions: [...image.dimensions]
    },
    pixelMask
  }
}
