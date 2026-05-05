'use client'

import { useState } from 'react'
import { ReactNode } from 'react'

interface VideoHeroProps {
  children: ReactNode
}

export function VideoHero({ children }: VideoHeroProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative px-4 pt-4 pb-6 overflow-hidden">
      {/* Video de fondo con efecto fade-in */}
      <video
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setIsLoading(false)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <source src="/uncupo.mp4" type="video/mp4" />
      </video>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-surface-base/80 animate-pulse" />
      )}

      {/* Filtro azul sutil con 50% opacity (sobre el video) */}
      <div className={`absolute inset-0 bg-blue-500/25 transition-opacity duration-1000 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      }`} />

      {/* Overlay oscuro (siempre presente para legibilidad del contenido inicial) */}
      <div className="absolute inset-0 bg-surface-base/60" />

      {/* Degradado inferior duplicado (h-64) para una transición ultra suave */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-b from-transparent via-surface-base/20 to-surface-base" />

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
