'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PublishFAB() {
  const pathname = usePathname()
  const isPublishPage = pathname === '/publicar'

  if (isPublishPage) return null

  return (
    <Link
      href="/publicar"
      className={cn(
        'fixed bottom-24 right-5 z-40',
        'w-14 h-14 rounded-full',
        'bg-brand hover:bg-brand-dark active:scale-90',
        'flex items-center justify-center',
        'shadow-glow shadow-lg',
        'transition-all duration-200',
        'animate-fade-in'
      )}
      aria-label="Publicar viaje"
    >
      <Plus size={26} strokeWidth={2.5} className="text-white" />
    </Link>
  )
}
