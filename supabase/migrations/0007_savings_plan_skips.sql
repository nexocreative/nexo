-- =============================================================
-- 0007_savings_plan_skips.sql
-- Permite "saltar" el aporte automático del plan mensual de una
-- categoría de ahorro en un mes concreto cuando el usuario borra esa
-- entrada, para que materializeSavingsPlan no la vuelva a crear.
-- =============================================================

create table if not exists public.savings_plan_skips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  category_id uuid not null references public.savings_categories(id) on delete cascade,
  month text not null,                       -- "YYYY-MM"
  created_at timestamptz not null default now(),
  unique (category_id, month)
);
create index if not exists savings_plan_skips_user_idx on public.savings_plan_skips (user_id);

alter table public.savings_plan_skips enable row level security;

drop policy if exists "savings_plan_skips_owner" on public.savings_plan_skips;
create policy "savings_plan_skips_owner" on public.savings_plan_skips
  for all to authenticated
  using (user_id = next_auth.uid())
  with check (user_id = next_auth.uid());
