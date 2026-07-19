-- =============================================================
-- 0009_savings_category_goal.sql
-- Permite definir una categoría de ahorro por objetivo + fecha límite
-- en vez de (o además de) un importe fijo al mes. El importe mensual
-- necesario se calcula solo a partir del objetivo, lo ahorrado hasta
-- ahora y el tiempo restante.
-- =============================================================

alter table public.savings_categories
  add column if not exists target_amount numeric(12,2),
  add column if not exists target_date date;
