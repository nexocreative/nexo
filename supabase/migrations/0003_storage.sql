-- =============================================================
-- 0003_storage.sql
-- Bucket privado para las fotos de tickets. Estructura de rutas:
--   receipts/{user_id}/{archivo}
-- Acceso vía URLs firmadas generadas en el servidor.
-- =============================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Cada usuario gestiona solo su carpeta (primer segmento = su id).
drop policy if exists "receipts_select" on storage.objects;
create policy "receipts_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = next_auth.uid()::text);

drop policy if exists "receipts_insert" on storage.objects;
create policy "receipts_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = next_auth.uid()::text);

drop policy if exists "receipts_update" on storage.objects;
create policy "receipts_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = next_auth.uid()::text);

drop policy if exists "receipts_delete" on storage.objects;
create policy "receipts_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = next_auth.uid()::text);
