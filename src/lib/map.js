import { generateRandomId } from '@allmaps/id'

export function convertToMap2(map) {
  if (map.version === 1) {
    return {
      id: map.id,
      gcps: Object.values(map.gcps).reduce(
        (gcps, { id, image, world }) => ({
          ...gcps,
          [id]: {
            id,
            resource: image,
            geo: world
          }
        }),
        {}
      ),
      resource: map.image,
      resourceMask: map.pixelMask,
      version: 2
    }
  }

  return map
}

export function convertToMaps2(maps) {
  let maps2 = {}
  for (const map of Object.values(maps)) {
    maps2[map.id] = convertToMap2(map)
  }

  return maps2
}

export async function createFullImageMap(image) {
  const mapId = await generateRandomId()

  const resourceMask = [
    [0, 0],
    [0, image.parsedImage.height],
    [image.parsedImage.width, image.parsedImage.height],
    [image.parsedImage.width, 0]
  ]

  return {
    id: mapId,
    resource: {
      id: image.imageId,
      uri: image.parsedImage.uri,
      width: image.parsedImage.width,
      height: image.parsedImage.height,
      type:
        image.parsedImage.majorVersion === 2 ? 'ImageService2' : 'ImageService3'
    },
    resourceMask
  }
}
