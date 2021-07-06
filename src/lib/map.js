import { createRandomId } from '@allmaps/id'

export async function createFullImageMap (image) {
  const mapId = await createRandomId()

  const pixelMask = [
    [0, 0],
    [0, image.height],
    [image.width, image.height],
    [image.width, 0]
  ]

  return {
    id: mapId,
    image: {
      id: image.id,
      uri: image.uri,
      width: image.width,
      height: image.height,
      version: image.version,
      quality: image.quality,
      format: image.format
    },
    pixelMask
  }
}
