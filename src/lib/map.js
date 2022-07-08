import { generateRandomId } from '@allmaps/id/browser'

export async function createFullImageMap(image) {
  const mapId = await generateRandomId()

  const pixelMask = [
    [0, 0],
    [0, image.parsedImage.height],
    [image.parsedImage.width, image.parsedImage.height],
    [image.parsedImage.width, 0]
  ]

  return {
    id: mapId,
    image: {
      id: image.imageId,
      uri: image.parsedImage.uri,
      width: image.parsedImage.width,
      height: image.parsedImage.height,
      type:
        image.parsedImage.majorVersion === 2 ? 'ImageService2' : 'ImageService3'
    },
    pixelMask
  }
}
