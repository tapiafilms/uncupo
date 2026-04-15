'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, CalendarDays, PlusCircle, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/home',       icon: Home,        label: 'Inicio' },
  { href: '/mis-viajes', icon: CalendarDays, label: 'Mis Viajes' },
  { href: '/publicar',   icon: PlusCircle,  label: 'Publicar', highlight: true },
  { href: '/perfil',     icon: User,        label: 'Perfil' },
]

const MIS_VIAJES_PATHS = ['/mis-viajes', '/viaje-activo', '/reserva-activa']

export function BottomNav() {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Cuando la navegación termina, limpiamos el pending
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label, highlight }) => {
        const isRouteActive =
          href === '/mis-viajes'
            ? MIS_VIAJES_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
            : pathname === href || pathname.startsWith(href + '/')

        // Activo real O esperando que cargue esta ruta
        const isActive  = isRouteActive && !pendingHref
        const isPending = pendingHref === href

        // Botón Publicar
        if (highlight) {
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPendingHref(href)}
              className="flex flex-col items-center gap-1 pt-1 pb-1 px-3"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-glow"
              >
                <Icon size={22} strokeWidth={2} className="text-white" />
              </motion.div>
              <span className="text-[10px] font-medium leading-none text-ink-muted">{label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setPendingHref(href)}
            className={cn(
              'flex flex-col items-center gap-0.5 pt-2 pb-1 px-5 rounded-xl transition-colors duration-100',
              isActive || isPending ? 'text-brand' : 'text-ink-muted',
            )}
          >
            <motion.div
              whileTap={{ scale: 1.25 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Icon
                size={22}
                strokeWidth={isActive || isPending ? 2.5 : 1.8}
                className="transition-all duration-100"
              />
            </motion.div>

            <span className={cn(
              'text-[10px] font-medium leading-none transition-opacity duration-100',
              isActive || isPending ? 'opacity-100' : 'opacity-60'
            )}>
              {label}
            </span>

            {/* Barra indicadora */}
            <div className="h-1 flex items-center justify-center">
              {(isActive || isPending) && (
                <motion.span
                  layoutId="nav-bar"
                  className="h-0.5 rounded-full bg-brand block"
                  animate={isPending
                    // Pulsa mientras carga
                    ? { scaleX: [1, 1.8, 1], opacity: [1, 0.5, 1], width: '16px' }
                    // Estática cuando ya cargó
                    : { scaleX: 1, opacity: 1, width: '16px' }
                  }
                  transition={isPending
                    ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 400, damping: 30 }
                  }
                />
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
