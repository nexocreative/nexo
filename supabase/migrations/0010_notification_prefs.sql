-- Preferencias de notificación por email.
alter table public.profiles
  add column if not exists notification_prefs jsonb not null
  default '{"grupo_invite": true, "grupo_gasto": true}'::jsonb;
