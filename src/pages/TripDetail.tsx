import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-black transition"
          >
            ← Volver
          </button>

          <h1 className="text-xl font-semibold text-gray-700">
            Detalle del viaje
          </h1>
        </div>

        {/* Card principal */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-400 mb-2">ID del viaje</p>
          <p className="text-lg font-medium text-gray-800 break-all">
            {id}
          </p>
        </div>

        {/* Secciones futuras */}
        <div className="space-y-4">

          {/* Placeholder 1 */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 text-gray-400 text-center">
            📍 Destinos (próximamente)
          </div>

          {/* Placeholder 2 */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 text-gray-400 text-center">
            🗓️ Itinerario (próximamente)
          </div>

          {/* Placeholder 3 */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 text-gray-400 text-center">
            💰 Presupuesto (próximamente)
          </div>

        </div>

      </div>
    </div>
  );
}