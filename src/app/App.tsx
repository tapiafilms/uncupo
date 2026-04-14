import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</QueryClientProvider>
  );
}