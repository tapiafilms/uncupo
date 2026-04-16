'use client'

import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/map/MapView').then(m => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] rounded-xl bg-surface-overlay border border-surface-border flex items-center justify-center">
      <p className="text-xs text-ink-muted">Cargando mapa…</p>
    </div>
  ),
})

export function TripMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  return <MapView lat={lat} lng={lng} label={label} height={200} />
}
