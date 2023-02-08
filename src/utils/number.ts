import { NumbersTuple } from 'schemas/helpers'

export function getValueEnclosedWithinRange(
  value: number,
  range: NumbersTuple
) {
  return Math.min(Math.max(value, range[0]), range[1])
}

export function valueIsWithinRange(value: number, range: NumbersTuple) {
  return (
    (value || value === 0) &&
    range[0] !== range[1] &&
    value > range[0] &&
    value < range[1]
  )
}
