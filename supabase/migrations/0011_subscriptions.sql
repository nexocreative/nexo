-- =============================================================
-- 0011_subscriptions.sql
-- Suscripción Nexo Plus (Stripe). Una fila por usuario.
-- =============================================================

create table if not exists public.subscriptions (
  user_id uuid primary key references next_auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'free', -- 'free' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Solo lectura para el propio usuario: las escrituras las hace el webhook
-- de Stripe vía supabaseAdmin() (service role, bypassa RLS).
drop policy if exists "subscriptions_read_own" on public.subscriptions;
create policy "subscriptions_read_own" on public.subscriptions
  for select to authenticated
  using (user_id = next_auth.uid());
