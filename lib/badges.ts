export interface Badge {
  id: string
  emoji: string
  label: string
  desc: string
  color: string
}

export function calcularBadges(stats: {
  total_viajes: number
  calificacion_promedio: number
  nivel_confianza: number
  cancelaciones?: number
  no_shows?: number
}): Badge[] {
  const badges: Badge[] = []

  if (stats.total_viajes === 0) {
    badges.push({ id: 'nuevo', emoji: '🌱', label: 'Nuevo', desc: 'Acaba de unirse a UnCupo', color: 'text-success bg-success/10' })
  }

  if (stats.total_viajes >= 5) {
    badges.push({ id: 'activo', emoji: '⚡', label: 'Activo', desc: '5+ viajes realizados', color: 'text-warning bg-warning/10' })
  }

  if (stats.total_viajes >= 20) {
    badges.push({ id: 'veterano', emoji: '🏆', label: 'Veterano', desc: '20+ viajes realizados', color: 'text-brand bg-brand/10' })
  }

  if (stats.total_viajes >= 50) {
    badges.push({ id: 'leyenda', emoji: '👑', label: 'Leyenda', desc: '50+ viajes realizados', color: 'text-warning bg-warning/10' })
  }

  if (stats.calificacion_promedio >= 4.8 && stats.total_viajes >= 5) {
    badges.push({ id: 'confiable', emoji: '⭐', label: 'Confiable', desc: 'Calificación 4.8+', color: 'text-warning bg-warning/10' })
  }

  if (stats.calificacion_promedio >= 4.5 && stats.total_viajes >= 3) {
    badges.push({ id: 'bien_valorado', emoji: '👍', label: 'Bien valorado', desc: 'Calificación 4.5+', color: 'text-success bg-success/10' })
  }

  if (stats.nivel_confianza >= 4) {
    badges.push({ id: 'verificado', emoji: '✅', label: 'Verificado', desc: 'Nivel de confianza alto', color: 'text-brand bg-brand/10' })
  }

  if ((stats.cancelaciones ?? 0) === 0 && stats.total_viajes >= 5) {
    badges.push({ id: 'puntual', emoji: '🎯', label: 'Puntual', desc: 'Sin cancelaciones', color: 'text-success bg-success/10' })
  }

  if ((stats.no_shows ?? 0) > 0) {
    badges.push({ id: 'no_show', emoji: '⚠️', label: 'No-show', desc: 'Ha tenido ausencias', color: 'text-danger bg-danger/10' })
  }

  return badges
}
