-- =============================================================
-- 0001_schema.sql
-- Modelo de datos de Nexo (esquema public).
-- =============================================================

create extension if not exists "uuid-ossp";

-- Enums (idempotentes)
do $$ begin
  create type public.transaction_type as enum ('expense','income');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_source as enum ('manual','photo','voice','recurring','chat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vacation_status as enum ('active','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recommendation_severity as enum ('info','warning','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.partner_link_status as enum ('pending','accepted','rejected');
exception when duplicate_object then null; end $$;

-- PERFILES -----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references next_auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'EUR',
  monthly_budget numeric(12,2),
  partner_id uuid references next_auth.users(id) on delete set null,
  share_consent boolean not null default false,
  created_at timestamptz not null default now()
);

-- REGLAS RECURRENTES (gastos fijos / ingresos fijos) ----------
create table if not exists public.recurring_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text,
  description text,
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  active boolean not null default true,
  last_generated_month text, -- "YYYY-MM"
  created_at timestamptz not null default now()
);
create index if not exists recurring_rules_user_idx on public.recurring_rules (user_id);

-- MODO VACACIONES ---------------------------------------------
create table if not exists public.vacation_periods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  name text not null,
  budget numeric(12,2) not null default 0,
  start_date date not null default current_date,
  end_date date,
  status public.vacation_status not null default 'active',
  summary jsonb,
  created_at timestamptz not null default now()
);
create index if not exists vacation_user_idx on public.vacation_periods (user_id);

-- TRANSACCIONES (gastos + ingresos) ---------------------------
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text,
  description text,
  merchant text,
  occurred_at date not null default current_date,
  source public.transaction_source not null default 'manual',
  receipt_url text,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  vacation_id uuid references public.vacation_periods(id) on delete set null,
  ai_confidence real,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on public.transactions (user_id, occurred_at desc);
create index if not exists transactions_user_cat_idx on public.transactions (user_id, category);

-- PRESUPUESTOS POR CATEGORÍA ----------------------------------
create table if not exists public.category_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  unique (user_id, category)
);

-- OBJETIVOS DE AHORRO -----------------------------------------
create table if not exists public.savings_goals (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references next_auth.users(id) on delete cascade,
  partner_id uuid references next_auth.users(id) on delete set null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0,
  target_date date not null,
  created_at timestamptz not null default now()
);

-- RECOMENDACIONES IA ------------------------------------------
create table if not exists public.ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  month text not null, -- "YYYY-MM"
  title text not null,
  content text not null,
  severity public.recommendation_severity not null default 'info',
  created_at timestamptz not null default now()
);
create index if not exists ai_reco_user_month_idx on public.ai_recommendations (user_id, month);

-- VÍNCULOS DE PAREJA (vista conjunta) -------------------------
create table if not exists public.partner_links (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references next_auth.users(id) on delete cascade,
  partner_id uuid not null references next_auth.users(id) on delete cascade,
  status public.partner_link_status not null default 'pending',
  requester_consent boolean not null default true,
  partner_consent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (requester_id, partner_id)
);
