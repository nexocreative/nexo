-- =============================================================
-- 0002_rls.sql
-- Row Level Security. Cada usuario solo accede a sus filas.
-- next_auth.uid() = sub del JWT firmado por NextAuth.
-- (El service_role del servidor omite RLS; esto es defensa en profundidad.)
-- =============================================================

alter table public.profiles            enable row level security;
alter table public.transactions        enable row level security;
alter table public.category_budgets    enable row level security;
alter table public.recurring_rules     enable row level security;
alter table public.vacation_periods    enable row level security;
alter table public.ai_recommendations  enable row level security;
alter table public.savings_goals       enable row level security;
alter table public.partner_links       enable row level security;

-- PROFILES: el propio usuario (y lectura del partner vinculado)
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all to authenticated
  using (id = next_auth.uid())
  with check (id = next_auth.uid());

-- Tablas con columna user_id: dueño únicamente
do $$
declare t text;
begin
  foreach t in array array[
    'transactions','category_budgets','recurring_rules',
    'vacation_periods','ai_recommendations'
  ]
  loop
    execute format('drop policy if exists "%s_owner" on public.%I;', t, t);
    execute format($f$
      create policy "%s_owner" on public.%I
        for all to authenticated
        using (user_id = next_auth.uid())
        with check (user_id = next_auth.uid());
    $f$, t, t);
  end loop;
end $$;

-- SAVINGS_GOALS: dueño o partner pueden leer; solo el dueño escribe
drop policy if exists "goals_read" on public.savings_goals;
create policy "goals_read" on public.savings_goals
  for select to authenticated
  using (owner_id = next_auth.uid() or partner_id = next_auth.uid());

drop policy if exists "goals_write" on public.savings_goals;
create policy "goals_write" on public.savings_goals
  for all to authenticated
  using (owner_id = next_auth.uid())
  with check (owner_id = next_auth.uid());

-- PARTNER_LINKS: el solicitante o el destinatario
drop policy if exists "links_involved" on public.partner_links;
create policy "links_involved" on public.partner_links
  for all to authenticated
  using (requester_id = next_auth.uid() or partner_id = next_auth.uid())
  with check (requester_id = next_auth.uid() or partner_id = next_auth.uid());
