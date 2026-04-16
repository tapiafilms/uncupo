'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Solo Android Chrome dispara este evento
    // No mostrar si ya está instalada (standalone) o si el usuario ya la descartó
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      localStorage.getItem('pwa-install-dismissed')
    ) return

    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    setVisible(false)
    setPrompt(null)
    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-install-dismissed', '1')
    }
  }

  function handleDismiss() {
    setVisible(false)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-slide-up">
      <div className="bg-surface-raised border border-brand/30 rounded-2xl p-4 shadow-card flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <img src="/icon-192.png" alt="UNcupo" className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink-primary leading-tight">Instalar UNcupo</p>
          <p className="text-xs text-ink-muted mt-0.5">Accede más rápido desde tu pantalla de inicio</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
          >
            <Download size={13} />
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
