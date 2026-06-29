-- =============================================================
-- 0005_login_throttle.sql
-- Registro de intentos de inicio de sesión para limitar la fuerza
-- bruta (throttling). Se cuentan los fallos recientes por email.
-- Solo accede el service role (supabaseAdmin); RLS sin políticas
-- bloquea el acceso desde el cliente.
-- =============================================================

create table if not exists public.login_attempts (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  ok boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx
  on public.login_attempts (email, created_at desc);

alter table public.login_attempts enable row level security;
