import { generateRandomId } from '@allmaps/id/browser'

export async function createFullImageMap(image) {
  const mapId = await generateRandomId()

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
      type: image.majorVersion === 2 ? 'ImageService2' : 'ImageService3'
    },
    pixelMask
  }
}
