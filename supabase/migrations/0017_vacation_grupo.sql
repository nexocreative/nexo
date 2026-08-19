-- Permite vincular un proyecto de vacaciones a un grupo de "En conjunto"
-- para poder ver, en la pestaña "Saldos" del viaje, quién debe a quién
-- (reutiliza toda la infraestructura de grupos/gastos compartidos/debt-
-- simplification ya existente en vez de duplicarla).
alter table public.vacation_periods
  add column if not exists grupo_id uuid references public.grupos(id) on delete set null;
