export function random(a, b) {
  const d = b - a
  return Math.random() * d + a
}

export function randomi(a, b) {
  return Math.floor(random(a, b))
}
