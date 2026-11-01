/** A stable blue-family wash per story, for stories without a photo. */
export function impactGradient(id: number): string {
  const hues = [200, 205, 210, 195, 215, 190]
  const h = hues[id % hues.length] ?? 205
  return `linear-gradient(135deg, hsl(${h} 46% 26%) 0%, hsl(${h} 50% 14%) 100%)`
}
