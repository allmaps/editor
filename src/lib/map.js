import { randomId } from './id'

export function createFullImageMap (image) {
  const mapId = randomId()

  const imageId = image.id
  const imageDimensions = [
    image.width,
    image.height
  ]

  const pixelMask = [
    [0, 0],
    [0, imageDimensions[1]],
    imageDimensions,
    [imageDimensions[0], 0],
    [0, 0]
  ]

  return { id: mapId, imageId, pixelMask }
}
