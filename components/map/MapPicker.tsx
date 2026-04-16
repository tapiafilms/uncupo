'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'

export interface LatLng { lat: number; lng: number }

interface Props {
  value: LatLng | null
  onChange: (coords: LatLng, address: string) => void
  defaultCenter?: LatLng
}

// Centro por defecto: Viña del Mar
const DEFAULT_CENTER: LatLng = { lat: -33.024, lng: -71.552 }

export function MapPicker({ value, onChange, defaultCenter = DEFAULT_CENTER }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)   // L instance
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [query, setQuery]       = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults]   = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [showResults, setShowResults] = useState(false)

  // Inicializar mapa (solo en browser)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Fix default icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      leafletRef.current = L

      const center = value ?? defaultCenter
      const map = L.map(mapRef.current!, { zoomControl: true }).setView(
        [center.lat, center.lng],
        value ? 16 : 13
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Si ya hay un valor, poner marker
      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng()
          reverseGeocode(pos.lat, pos.lng, L, onChange)
        })
      }

      // Click en mapa para poner/mover pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        placeMarker(lat, lng, L, map)
        reverseGeocode(lat, lng, L, onChange)
      })

      mapInstanceRef.current = map
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Sincronizar si value cambia externamente
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current || !value) return
    placeMarker(value.lat, value.lng, leafletRef.current, mapInstanceRef.current)
    mapInstanceRef.current.setView([value.lat, value.lng], 16)
  }, [value?.lat, value?.lng])

  function placeMarker(lat: number, lng: number, L: any, map: any) {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng()
        reverseGeocode(pos.lat, pos.lng, L, onChange)
      })
    }
  }

  async function reverseGeocode(lat: number, lng: number, _L: any, cb: Props['onChange']) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      cb({ lat, lng }, data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      cb({ lat, lng }, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    }
  }

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setShowResults(false)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=cl`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      setResults(data)
      setShowResults(true)
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  function selectResult(r: { display_name: string; lat: string; lon: string }) {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setShowResults(false)
    setQuery(r.display_name)
    if (mapInstanceRef.current && leafletRef.current) {
      placeMarker(lat, lng, leafletRef.current, mapInstanceRef.current)
      mapInstanceRef.current.setView([lat, lng], 16)
    }
    onChange({ lat, lng }, r.display_name)
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Buscar dirección…"
              className="input pl-9 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-3 rounded-xl bg-surface-overlay border border-surface-border text-ink-secondary disabled:opacity-40"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {/* Results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-surface-border rounded-xl shadow-lg z-[1000] overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="w-full text-left px-3 py-2.5 text-xs text-ink-secondary hover:bg-surface-overlay border-b border-surface-border last:border-0 flex items-start gap-2"
              >
                <MapPin size={12} className="text-brand mt-0.5 shrink-0" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-surface-border">
        <div ref={mapRef} style={{ height: 240 }} />
        {!value && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
            <p className="text-xs bg-surface-raised/90 text-ink-muted px-3 py-1.5 rounded-full border border-surface-border">
              Toca el mapa para marcar el punto exacto
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
