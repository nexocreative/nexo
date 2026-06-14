-- =============================================================
-- 0004_password.sql
-- Soporte de login con email + contraseña (NextAuth Credentials).
-- La contraseña se guarda hasheada (bcrypt) en next_auth.users.
-- =============================================================

alter table next_auth.users
  add column if not exists password text;

-- Evita emails duplicados (case-insensitive).
create unique index if not exists users_email_unique
  on next_auth.users (lower(email));
