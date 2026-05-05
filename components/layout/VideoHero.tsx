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
      {/* Video de fondo */}
      <video
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setIsLoading(false)}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/uncupo.mp4" type="video/mp4" />
      </video>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-surface-base/80 animate-pulse" />
      )}

      {/* Filtro azul sutil con 50% opacity */}
      <div className="absolute inset-0 bg-blue-500/25" />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-surface-base/60" />

      {/* Degradado inferior extendido */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-surface-base/0 to-surface-base" />

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
