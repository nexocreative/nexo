-- =============================================================
-- 0004_ai_usage.sql
-- Registro de uso de los endpoints de IA (foto ticket / voz) para
-- limitar la frecuencia de uso por usuario (rate limiting).
-- =============================================================

create table if not exists public.ai_usage_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  kind text not null, -- 'ticket' | 'voice'
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_events_user_kind_idx
  on public.ai_usage_events (user_id, kind, created_at desc);

alter table public.ai_usage_events enable row level security;

drop policy if exists "ai_usage_events_owner" on public.ai_usage_events;
create policy "ai_usage_events_owner" on public.ai_usage_events
  for all to authenticated
  using (user_id = next_auth.uid())
  with check (user_id = next_auth.uid());
