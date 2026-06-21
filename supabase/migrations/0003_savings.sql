-- =============================================================
-- 0003_savings.sql
-- Ahorro mensual por categorías (modelo híbrido):
--   · cada categoría tiene un "plan" mensual que se contabiliza solo
--   · además se pueden añadir aportes/ajustes manuales por mes
--   · el ahorro del mes se resta del balance (ingresos - gastos - ahorro)
-- =============================================================

-- CATEGORÍAS DE AHORRO ----------------------------------------
create table if not exists public.savings_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  name text not null,
  monthly_plan numeric(12,2) not null default 0 check (monthly_plan >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists savings_categories_user_idx on public.savings_categories (user_id);

-- APORTES DE AHORRO -------------------------------------------
-- source: 'plan'  -> generado automáticamente desde el plan mensual
--         'manual'-> aporte / ajuste introducido a mano
create table if not exists public.savings_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  category_id uuid references public.savings_categories(id) on delete cascade,
  amount numeric(12,2) not null,
  month text not null,                       -- "YYYY-MM"
  source text not null default 'manual',     -- 'plan' | 'manual'
  note text,
  created_at timestamptz not null default now()
);
create index if not exists savings_entries_user_month_idx on public.savings_entries (user_id, month);
-- Solo puede existir una entrada 'plan' por categoría y mes (idempotencia).
create unique index if not exists savings_entries_plan_uniq
  on public.savings_entries (category_id, month)
  where source = 'plan';

-- RLS ---------------------------------------------------------
alter table public.savings_categories enable row level security;
alter table public.savings_entries    enable row level security;

drop policy if exists "savings_categories_owner" on public.savings_categories;
create policy "savings_categories_owner" on public.savings_categories
  for all to authenticated
  using (user_id = next_auth.uid())
  with check (user_id = next_auth.uid());

drop policy if exists "savings_entries_owner" on public.savings_entries;
create policy "savings_entries_owner" on public.savings_entries
  for all to authenticated
  using (user_id = next_auth.uid())
  with check (user_id = next_auth.uid());
