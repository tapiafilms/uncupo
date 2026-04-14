'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DbViaje, DbReserva } from '@/lib/types'

interface RealtimeViajeState {
  viaje: DbViaje | null
  reservas: DbReserva[]
  loading: boolean
}

export function useRealtimeViaje(viajeId: string) {
  // useRef evita recrcar el cliente en cada render
  const supabase = useRef(createClient()).current

  const [state, setState] = useState<RealtimeViajeState>({
    viaje: null,
    reservas: [],
    loading: true,
  })

  const fetchData = useCallback(async () => {
    const [{ data: viaje }, { data: reservas }] = await Promise.all([
      supabase.from('viajes').select('*').eq('id', viajeId).single(),
      supabase.from('reservas').select('*').eq('viaje_id', viajeId),
    ])
    setState({ viaje: viaje as DbViaje, reservas: (reservas as DbReserva[]) ?? [], loading: false })
  }, [viajeId, supabase])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`viaje-${viajeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'viajes', filter: `id=eq.${viajeId}` },
        (payload) => {
          setState((prev) => ({ ...prev, viaje: payload.new as DbViaje }))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservas', filter: `viaje_id=eq.${viajeId}` },
        () => {
          supabase
            .from('reservas')
            .select('*')
            .eq('viaje_id', viajeId)
            .then(({ data }) => {
              setState((prev) => ({ ...prev, reservas: (data as DbReserva[]) ?? [] }))
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [viajeId, fetchData, supabase])

  return state
}

export function useRealtimeReserva(reservaId: string) {
  const supabase = useRef(createClient()).current
  const [reserva, setReserva] = useState<DbReserva | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reservas')
      .select('*')
      .eq('id', reservaId)
      .single()
      .then(({ data }) => {
        setReserva(data as DbReserva)
        setLoading(false)
      })

    const channel = supabase
      .channel(`reserva-${reservaId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservas', filter: `id=eq.${reservaId}` },
        (payload) => {
          setReserva(payload.new as DbReserva)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reservaId, supabase])

  return { reserva, loading }
}
