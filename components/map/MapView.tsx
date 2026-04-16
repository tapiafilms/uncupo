'use client'

import { useEffect, useRef } from 'react'

interface Props {
  lat: number
  lng: number
  label?: string
  height?: number
}

export function MapView({ lat, lng, label, height = 200 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { zoomControl: false, scrollWheelZoom: false })
        .setView([lat, lng], 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([lat, lng]).addTo(map)
      if (label) marker.bindPopup(label).openPopup()

      mapInstanceRef.current = map
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [lat, lng])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-surface-border z-0"
    />
  )
}
