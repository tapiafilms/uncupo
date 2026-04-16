// ─── Domain Types ────────────────────────────────────────────────────────────

export type UserRole = 'pasajero' | 'chofer' | 'ambos'

export type TripState =
  | 'publicado'
  | 'confirmado'
  | 'en_camino'
  | 'en_destino'
  | 'finalizado'
  | 'cancelado'

export type PassengerState =
  | 'reservado'
  | 'en_camino'
  | 'en_el_punto'
  | 'en_viaje'
  | 'llego'
  | 'pago_confirmado'

export type NotificationType =
  | 'nueva_reserva'
  | 'reserva_cancelada'
  | 'viaje_iniciado'
  | 'viaje_finalizado'
  | 'pago_confirmado'
  | 'nueva_alerta'
  | 'calificacion_recibida'

// ─── Database Row Types ──────────────────────────────────────────────────────

export interface DbUser {
  id: string
  nombre: string
  telefono: string
  foto_url: string | null
  sector: string
  rut: string | null
  nivel_confianza: number
  calificacion_promedio: number
  total_viajes: number
  creado_en: string
}

export interface DbVehiculo {
  id: string
  user_id: string
  patente: string
  marca: string
  modelo: string
  color: string
  foto_url: string | null
  verificado: boolean
}

export interface DbViaje {
  id: string
  chofer_id: string
  vehiculo_id: string | null
  origen: string
  destino: string
  lat_origen: number | null
  lng_origen: number | null
  lat_destino: number | null
  lng_destino: number | null
  fecha_hora: string
  cupos_total: number
  cupos_disponibles: number
  precio_cupo: number
  estado: TripState
  notas: string | null
  creado_en: string
}

export interface DbReserva {
  id: string
  viaje_id: string
  pasajero_id: string
  estado_pasajero: PassengerState
  pago_confirmado: boolean
  creado_en: string
}

export interface DbAlerta {
  id: string
  pasajero_id: string
  origen: string
  destino: string
  fecha_min: string | null
  fecha_max: string | null
  hora_min: string | null
  hora_max: string | null
  precio_max: number | null
  activa: boolean
}

export interface DbCalificacion {
  id: string
  viaje_id: string
  de_user_id: string
  a_user_id: string
  estrellas: number
  comentario: string | null
  creado_en: string
}

export interface DbNotificacion {
  id: string
  user_id: string
  tipo: NotificationType
  titulo: string
  mensaje: string
  leido: boolean
  creado_en: string
}

// ─── Enriched / View Types ───────────────────────────────────────────────────

export interface ViajeConChofer extends DbViaje {
  chofer: DbUser
  vehiculo: DbVehiculo | null
  reservas?: DbReserva[]
}

export interface ReservaConViaje extends DbReserva {
  viaje: ViajeConChofer
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const SECTORES = [
  'Bosques de Montemar',
  'Costa de Montemar',
  'Lomas de Montemar',
  'Pinares de Montemar',
  'Reñaca',
  'Viña del Mar centro',
  'Concón',
  'Quilpué',
  'Villa Alemana',
  'Valparaíso',
  'Santiago',
  'Otro',
] as const

export const PUNTOS_VINA = [
  'Bosques de Montemar',
  'Costa de Montemar',
  'Lomas de Montemar',
  'Pinares de Montemar',
] as const

export const ZONAS_SANTIAGO = [
  'Pajaritos',
  'Estación Central',
  'Providencia',
  'Las Condes',
  'Pudahuel',
  'Maipú',
] as const

export type PuntoVina = (typeof PUNTOS_VINA)[number]
export type ZonaSantiago = (typeof ZONAS_SANTIAGO)[number]
