/**
 * Formata minutos como string legível de duração.
 * Ex: 90 → "1h 30min" | 60 → "1h" | 45 → "45min" | 0 → "0min"
 */
export function formatScreenTime(minutes: number): string {
  if (minutes <= 0) return "0min"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}
