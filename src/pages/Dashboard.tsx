import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrips } from "../features/trips/hooks/useTrips";
import { Database } from "../types/database";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

export default function Dashboard() {
  const { trips, loading, createTrip, deleteTrip } = useTrips();
  const [tripName, setTripName] = useState("");
  const navigate = useNavigate();

  const handleCreateTrip = () => {
    if (!tripName.trim()) return;
    createTrip(tripName);
    setTripName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8">
        
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          ✈️ Mis Viajes
        </h1>

        {/* Crear trip */}
        <div className="flex gap-2 mb-6">
          <input
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="Ej: Viaje a Japón 🇯🇵"
            className="flex-1 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
          />

          <button
            onClick={handleCreateTrip}
            disabled={loading}
            className="bg-black text-white px-5 py-3 rounded-xl hover:opacity-80 transition"
          >
            {loading ? "..." : "Crear"}
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {trips.length === 0 && (
            <p className="text-gray-400 text-center mt-10">
              Aún no tienes viajes ✨
            </p>
          )}

          {trips.map((trip: Trip) => (
            <div
              key={trip.id}
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="group flex justify-between items-center bg-gray-50 p-4 rounded-xl cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-gray-800 font-medium group-hover:underline">
                {trip.name}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTrip(trip.id);
                }}
                className="text-gray-400 hover:text-red-500 transition"
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