import React from "react";
import { useParams } from "react-router-dom";

export default function TripDetail() {
  const { id } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <h1>Trip Detail ✈️</h1>
      <p>ID del viaje: {id}</p>

      {/* luego agregaremos más cosas aquí */}
    </div>
  );
}