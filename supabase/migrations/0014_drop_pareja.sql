-- Elimina el backend legado de "pareja" (vínculo 1-a-1 y ahorro conjunto),
-- reemplazado por "Juntos" (grupos: public.grupos / grupo_miembros / grupo_gastos).
-- Ninguna de estas tablas/columnas tiene referencias en el código actual.

drop table if exists public.partner_links;
drop table if exists public.savings_goals;

alter table public.profiles
  drop column if exists partner_id,
  drop column if exists share_consent;
