export function monthRangeUTC(d = new Date()) {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const start = new Date(Date.UTC(y, m, 1))
  const end = new Date(Date.UTC(y, m + 1, 1))
  return { start, end }
}
