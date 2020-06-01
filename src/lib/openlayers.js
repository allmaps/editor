import {shiftKeyOnly, singleClick} from 'ol/events/condition'

export function deleteCondition (event) {
  return shiftKeyOnly(event) &&
    singleClick(event)
}
