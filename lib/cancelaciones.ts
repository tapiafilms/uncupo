export type CancelacionTipo = 'libre' | 'advertencia' | 'penalizacion' | 'bloqueado'

export interface CancelacionResult {
  tipo: CancelacionTipo
  mensaje: string
  permitido: boolean
}

/**
 * Evalúa la política de cancelación según el tiempo restante al viaje
 */
export function evaluarCancelacion(
  fechaHoraViaje: string,
  noShowsPrevios: number = 0
): CancelacionResult {
  if (noShowsPrevios >= 3) {
    return {
      tipo: 'bloqueado',
      mensaje: 'Tu cuenta está suspendida temporalmente por 3 no-shows. Se reactivará en 24h.',
      permitido: false,
    }
  }

  const ahora = Date.now()
  const viaje = new Date(fechaHoraViaje).getTime()
  const diffMs = viaje - ahora
  const diffMin = diffMs / 60000

  if (diffMin > 120) {
    return {
      tipo: 'libre',
      mensaje: 'Cancelación gratuita — más de 2 horas antes del viaje.',
      permitido: true,
    }
  }

  if (diffMin > 30) {
    return {
      tipo: 'advertencia',
      mensaje: `Cancelación tardía (${Math.round(diffMin)} min antes). Se registrará en tu historial.`,
      permitido: true,
    }
  }

  if (diffMin > 0) {
    return {
      tipo: 'penalizacion',
      mensaje: 'Cancelación en los últimos 30 minutos. Se registrará como no-show.',
      permitido: true,
    }
  }

  return {
    tipo: 'penalizacion',
    mensaje: 'El viaje ya comenzó. No puedes cancelar.',
    permitido: false,
  }
}

/**
 * Verifica si un pasajero debe ser liberado automáticamente
 * (no actualizó estado en los 30min previos al viaje)
 */
export function debeLiberar(
  fechaHoraViaje: string,
  ultimaActualizacion: string,
  estadoPasajero: string
): boolean {
  if (['en_el_punto', 'en_viaje', 'llego', 'pago_confirmado'].includes(estadoPasajero)) {
    return false
  }

  const viaje = new Date(fechaHoraViaje).getTime()
  const ahora = Date.now()
  const diffMin = (viaje - ahora) / 60000

  // Solo aplica en la ventana de 30 min antes
  if (diffMin > 30 || diffMin < 0) return false

  const ultima = new Date(ultimaActualizacion).getTime()
  const minSinActividad = (ahora - ultima) / 60000

  return minSinActividad > 30
}
