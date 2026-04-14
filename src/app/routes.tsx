import TripDetail from "../pages/TripDetail";
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Auth from "../pages/Auth";
import ProtectedRoute from "../app/router/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route path="/auth" element={<Auth />} />
  <Route path="/trip/:id" element={<TripDetail />} />
</Routes>
  );
}