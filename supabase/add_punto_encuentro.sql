-- Agrega coordenadas de punto de encuentro al viaje
ALTER TABLE public.viajes
  ADD COLUMN IF NOT EXISTS punto_encuentro_lat float,
  ADD COLUMN IF NOT EXISTS punto_encuentro_lng float;
