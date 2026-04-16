'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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

  // Hide bottom nav in full-screen views
  if (pathname.startsWith('/chat/')) return null
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limpia pending cuando la navegación termina
  useEffect(() => {
    setPendingHref(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [pathname])

  function handleTap(href: string) {
    setPendingHref(href)
    // Safety: limpia pending después de 3s aunque la ruta no cambie
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setPendingHref(null), 3000)
  }

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label, highlight }) => {
        const isRouteActive =
          href === '/mis-viajes'
            ? MIS_VIAJES_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
            : pathname === href || pathname.startsWith(href + '/')

        const isActive  = isRouteActive && !pendingHref
        const isPending = pendingHref === href
        const showActive = isActive || isPending

        // Botón Publicar
        if (highlight) {
          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleTap(href)}
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
            onClick={() => handleTap(href)}
            className={cn(
              'flex flex-col items-center gap-0.5 pt-2 pb-1 px-5 rounded-xl transition-colors duration-100',
              showActive ? 'text-brand' : 'text-ink-muted',
            )}
          >
            <motion.div
              whileTap={{ scale: 1.25 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Icon
                size={22}
                strokeWidth={showActive ? 2.5 : 1.8}
                className="transition-all duration-100"
              />
            </motion.div>

            <span className={cn(
              'text-[10px] font-medium leading-none transition-opacity duration-100',
              showActive ? 'opacity-100' : 'opacity-60'
            )}>
              {label}
            </span>

            <div className="h-1 flex items-center justify-center">
              {showActive && (
                <motion.span
                  layoutId="nav-bar"
                  className="w-4 h-0.5 rounded-full bg-brand block"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
