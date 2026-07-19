-- =============================================================
-- 0008_drop_savings_plan_skips.sql
-- El aporte mensual del plan de ahorro ya no se genera solo (0007):
-- ahora el usuario añade cada mes lo que realmente ha ahorrado, así
-- que la tabla de "saltos" del plan deja de tener sentido.
-- =============================================================

drop table if exists public.savings_plan_skips;
