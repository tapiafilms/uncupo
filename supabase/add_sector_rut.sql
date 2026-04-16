-- Migración: agregar sector y rut a users
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sector text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rut    text;
