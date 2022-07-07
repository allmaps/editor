const isObject = (obj) => typeof obj === 'object'

const isArray = (obj) => Array.isArray(obj)

export function parseOperations(op) {
  if (isArray(op[0])) {
    return op.map(parseOperations).flat()
  } else {
    const mapId = op[0]
    return [parseMapOp(mapId, op.slice(1))].flat()
  }
}

function parseMapOp(mapId, op) {
  if (isArray(op[0])) {
    return op.map((op) => parseMapOp(mapId, op))
  } else if (isObject(op[0])) {
    return {
      mapId,
      type: 'map',
      instructions: op[0]
    }
  } else {
    const prop = op[0]
    return parsePropOp(mapId, prop, op.slice(1))
  }
}

function parsePropOp(mapId, prop, op) {
  if (isArray(op[0])) {
    return op.map((op) => parsePropOp(mapId, prop, op))
  } else if (isObject(op[0])) {
    throw new Error('Oh no!')
  } else {
    const key = op[0]

    return {
      mapId,
      type: prop,
      key,
      instructions: op[1]
    }
  }
}
