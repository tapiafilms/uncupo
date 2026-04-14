'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/home',           icon: Home,        label: 'Inicio' },
  { href: '/mis-viajes',     icon: CalendarDays, label: 'Mis Viajes' },
  { href: '/publicar',       icon: PlusCircle,  label: 'Publicar', highlight: true },
  { href: '/perfil',         icon: User,        label: 'Perfil' },
]

// Rutas que pertenecen al tab "Mis Viajes"
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

        // Botón Publicar — tratamiento especial, nunca "activo"
        if (highlight) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 pt-1 pb-1 px-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-glow active:scale-95 transition-transform duration-150">
                <Icon size={22} strokeWidth={2} className="text-white" />
              </div>
              <span className="text-[10px] font-medium leading-none text-ink-muted">
                {label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 pt-2 pb-1 px-5 rounded-xl transition-all duration-150',
              isActive ? 'text-brand' : 'text-ink-muted',
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className="transition-all duration-150" />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium leading-none',
              isActive ? 'opacity-100' : 'opacity-60'
            )}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
