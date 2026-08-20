-- =============================================================
-- 0018_custom_categories.sql
-- Categorías de gasto personalizadas por usuario, además de las 10
-- categorías por defecto (fijas, definidas en el código). Se guardan
-- aparte porque las categorías por defecto no son editables ni
-- borrables (evita romper gastos ya categorizados).
-- =============================================================

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references next_auth.users(id) on delete cascade,
  label text not null,
  icon text not null default 'Package',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories (user_id);

alter table public.categories enable row level security;

drop policy if exists "categories_owner" on public.categories;
create policy "categories_owner" on public.categories
  for all to authenticated
  using (user_id = next_auth.uid())
  with check (user_id = next_auth.uid());
