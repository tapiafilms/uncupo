-- ─── Storage Buckets ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',   'avatars',   true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('vehiculos', 'vehiculos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── Avatars policies ────────────────────────────────────────────────────────

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Vehiculos policies ──────────────────────────────────────────────────────

CREATE POLICY "vehiculos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehiculos');

CREATE POLICY "vehiculos_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehiculos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vehiculos_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vehiculos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vehiculos_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehiculos' AND auth.uid()::text = (storage.foldername(name))[1]);
