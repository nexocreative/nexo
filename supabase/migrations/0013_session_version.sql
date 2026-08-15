-- =============================================================
-- 0013_session_version.sql
-- Añade una "versión de sesión" a next_auth.users para poder invalidar
-- las sesiones JWT ya emitidas cuando se cambia/resetea la contraseña.
-- Con next-auth en modo JWT (sin sesiones en base de datos), un token ya
-- firmado sigue siendo válido hasta que caduca aunque se cambie la
-- contraseña; esta columna permite cortarlo en el siguiente request.
-- =============================================================

alter table next_auth.users
  add column if not exists session_version bigint not null default 0;
