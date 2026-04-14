'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Car, Edit2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { DbVehiculo } from '@/lib/types'
import { VehiculoForm } from './VehiculoForm'

interface Props {
  userId: string
  vehiculos: DbVehiculo[]
}

export function VehiculosClient({ userId, vehiculos }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DbVehiculo | null>(null)

  const openAdd = () => { setEditing(null); setShowForm(true) }
  const openEdit = (v: DbVehiculo) => { setEditing(v); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

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
