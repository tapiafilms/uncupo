import React, { useState } from "react";
import { useTrips } from "../features/trips/hooks/useTrips";

export default function Dashboard() {
  const { trips, loading, createTrip, deleteTrip } = useTrips();
  const [tripName, setTripName] = useState("");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard 🚀</h1>

        <input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="Nombre del viaje..."
          className="border p-2 rounded-lg w-full mb-3"
        />

        <button
          onClick={() => createTrip(tripName)}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          {loading ? "Creando..." : "Crear Trip"}
        </button>

        <h2 className="mt-6 mb-2 text-lg font-semibold">Mis viajes</h2>

        <div className="space-y-2">
          {trips.length === 0 && (
            <p className="text-gray-500">No hay viajes aún</p>
          )}

          {trips.map((trip: any) => (
            <div
              key={trip.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
            >
              <span>{trip.name}</span>

              <button
                onClick={() => deleteTrip(trip.id)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}