'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'Inicio' },
  { href: '/mis-viajes', icon: CalendarDays, label: 'Mis Viajes' },
  { href: '/publicar', icon: PlusCircle, label: 'Publicar', highlight: true },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label, highlight }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 pt-2 pb-1 px-5 rounded-xl transition-all duration-150',
              isActive && !highlight && 'text-brand',
              !isActive && !highlight && 'text-ink-muted',
              highlight && 'text-brand'
            )}
          >
            <div className={cn(
              'relative',
              highlight && isActive && 'drop-shadow-[0_0_8px_rgba(108,99,255,0.8)]'
            )}>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  'transition-all duration-150',
                  highlight && 'scale-110'
                )}
              />
              {isActive && !highlight && (
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
