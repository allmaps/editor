export function round(num, decimals = 2) {
  const pow = 10 ** decimals
  return Math.round((num + Number.EPSILON) * pow) / pow
}
