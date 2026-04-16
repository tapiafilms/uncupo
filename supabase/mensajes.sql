-- ============================================================
-- Chat: tabla mensajes + cleanup trigger + RLS + Realtime
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Tabla
CREATE TABLE IF NOT EXISTS public.mensajes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserva_id  uuid NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  de_user_id  uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  texto       text NOT NULL CHECK (char_length(texto) <= 500),
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_reserva ON public.mensajes(reserva_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_creado  ON public.mensajes(creado_en);

-- RLS
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- Solo participantes de esa reserva pueden leer
CREATE POLICY "mensajes: participantes read"
  ON public.mensajes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      JOIN  public.viajes v ON v.id = r.viaje_id
      WHERE r.id = reserva_id
        AND (r.pasajero_id = auth.uid() OR v.chofer_id = auth.uid())
    )
  );

-- Solo participantes pueden insertar sus propios mensajes
CREATE POLICY "mensajes: participantes insert"
  ON public.mensajes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = de_user_id
    AND EXISTS (
      SELECT 1 FROM public.reservas r
      JOIN  public.viajes v ON v.id = r.viaje_id
      WHERE r.id = reserva_id
        AND (r.pasajero_id = auth.uid() OR v.chofer_id = auth.uid())
    )
  );

-- Trigger: borrar mensajes cuando el viaje termina o se cancela
CREATE OR REPLACE FUNCTION public.cleanup_mensajes_viaje()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.estado IN ('finalizado', 'cancelado')
     AND OLD.estado NOT IN ('finalizado', 'cancelado') THEN
    DELETE FROM public.mensajes
    WHERE reserva_id IN (
      SELECT id FROM public.reservas WHERE viaje_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_mensajes_viaje
  AFTER UPDATE ON public.viajes
  FOR EACH ROW EXECUTE PROCEDURE public.cleanup_mensajes_viaje();

-- Agregar mensajes a Realtime
-- (ejecutar si no está ya en la publicación)
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
