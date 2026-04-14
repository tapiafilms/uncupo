'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Car, Edit2, CheckCircle, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { DbVehiculo } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { VehiculoForm } from './VehiculoForm'

interface Props {
  userId: string
  vehiculos: DbVehiculo[]
}

export function VehiculosClient({ userId, vehiculos }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DbVehiculo | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const openAdd = () => { setEditing(null); setShowForm(true) }
  const openEdit = (v: DbVehiculo) => { setEditing(v); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('vehiculos').delete().eq('id', id)
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 mb-5">
        <Link href="/perfil" className="btn-ghost p-2 -ml-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-ink-primary flex-1">Mis vehículos</h1>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={15} />
            Agregar
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-semibold text-ink-primary mb-4">
            {editing ? 'Editar vehículo' : 'Nuevo vehículo'}
          </p>
          <VehiculoForm
            userId={userId}
            vehiculo={editing ?? undefined}
            onDone={closeForm}
          />
        </div>
      )}

      {/* Vehicle list */}
      {vehiculos.length === 0 && !showForm ? (
        <div className="card p-8 text-center">
          <Car size={40} className="text-ink-muted mx-auto mb-3" />
          <p className="text-ink-secondary font-medium">Sin vehículos registrados</p>
          <p className="text-ink-muted text-sm mt-1">Agrega tu auto para publicar viajes</p>
          <button onClick={openAdd} className="btn-primary mt-4 px-6">
            Agregar vehículo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehiculos.map((v) => (
            <div key={v.id} className="card overflow-hidden">
              {/* Car photo */}
              {v.foto_url ? (
                <img
                  src={v.foto_url}
                  alt={`${v.marca} ${v.modelo}`}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-surface-overlay flex items-center justify-center">
                  <Car size={40} className="text-ink-muted" />
                </div>
              )}

              <div className="p-4">
                {/* Confirm delete */}
                {confirmId === v.id && (
                  <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-3 animate-fade-in">
                    <p className="text-sm text-danger font-medium mb-2">¿Eliminar este vehículo?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="btn-secondary flex-1 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="flex-1 py-2 rounded-xl bg-danger text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {deletingId === v.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-ink-primary">
                      {v.marca} {v.modelo}
                    </p>
                    <p className="text-sm text-ink-secondary mt-0.5">
                      {v.color} · {v.patente}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.verificado && (
                      <CheckCircle size={16} className="text-success" />
                    )}
                    <button
                      onClick={() => openEdit(v)}
                      className="p-2 rounded-xl bg-surface-overlay text-ink-muted hover:text-brand transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmId(v.id)}
                      className="p-2 rounded-xl bg-surface-overlay text-ink-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
