'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label, highlight }) => {
        const isActive =
          href === '/mis-viajes'
            ? MIS_VIAJES_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
            : pathname === href || pathname.startsWith(href + '/')

        // Botón Publicar
        if (highlight) {
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 pt-1 pb-1 px-3">
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
            className={cn(
              'flex flex-col items-center gap-0.5 pt-2 pb-1 px-5 rounded-xl',
              isActive ? 'text-brand' : 'text-ink-muted',
            )}
          >
            <motion.div
              whileTap={{ scale: 1.25 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="transition-all duration-150"
              />
            </motion.div>
            <span className={cn(
              'text-[10px] font-medium leading-none',
              isActive ? 'opacity-100' : 'opacity-60'
            )}>
              {label}
            </span>
            <div className="h-1 flex items-center justify-center">
              {isActive && (
                <motion.span
                  layoutId="nav-dot"
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
