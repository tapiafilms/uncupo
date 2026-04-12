import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Trip = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
};

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripName, setTripName] = useState("");

  const getTrips = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setTrips(data || []);
  };

  const createTrip = async () => {
    if (!tripName.trim()) {
      alert("Escribe un nombre ❌");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes iniciar sesión ❌");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("trips")
      .insert([
        {
          name: tripName,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error(error);
      alert("Error ❌");
    } else if (data) {
      setTrips((prev) => [...prev, data[0]]);
      setTripName("");
    }

    setLoading(false);
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Error eliminando ❌");
      return;
    }

    setTrips((prev) => prev.filter((trip) => trip.id !== id));
  };

  useEffect(() => {
    getTrips();
  }, []);

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
          onClick={createTrip}
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

          {trips.map((trip) => (
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