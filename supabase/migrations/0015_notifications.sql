-- =============================================================
-- 0015_notifications.sql
-- Notificaciones en app (campanita): alertas de presupuesto y, a futuro,
-- cualquier otro evento que deba quedar registrado (no solo enviarse por
-- push/email como ya hacían las invitaciones/gastos de grupo).
-- =============================================================

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  type text not null,          -- 'budget_alert' | futuros tipos
  title text not null,
  body text not null,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications
  for all to authenticated
  using (user_id = next_auth.uid())
  with check (user_id = next_auth.uid());
