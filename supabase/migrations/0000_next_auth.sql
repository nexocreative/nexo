-- =============================================================
-- 0000_next_auth.sql
-- Esquema requerido por @next-auth/supabase-adapter.
-- Fuente: https://authjs.dev/getting-started/adapters/supabase
-- IMPORTANTE: tras ejecutarlo, añade el esquema `next_auth` en
-- Supabase → Settings → API → "Exposed schemas".
-- =============================================================

create extension if not exists "uuid-ossp";

create schema if not exists next_auth;
grant usage on schema next_auth to service_role;
grant all on schema next_auth to postgres;

-- Función auxiliar: id del usuario a partir del JWT (sub).
create or replace function next_auth.uid() returns uuid
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create table if not exists next_auth.users (
  id uuid not null default uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  primary key (id)
);
grant all on table next_auth.users to postgres;
grant all on table next_auth.users to service_role;

create table if not exists next_auth.sessions (
  id uuid not null default uuid_generate_v4(),
  expires timestamptz not null,
  "sessionToken" text not null,
  "userId" uuid references next_auth.users(id) on delete cascade,
  primary key (id)
);
grant all on table next_auth.sessions to postgres;
grant all on table next_auth.sessions to service_role;

create table if not exists next_auth.accounts (
  id uuid not null default uuid_generate_v4(),
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  "userId" uuid references next_auth.users(id) on delete cascade,
  primary key (id)
);
grant all on table next_auth.accounts to postgres;
grant all on table next_auth.accounts to service_role;

create table if not exists next_auth.verification_tokens (
  identifier text,
  token text,
  expires timestamptz not null,
  primary key (token)
);
grant all on table next_auth.verification_tokens to postgres;
grant all on table next_auth.verification_tokens to service_role;
