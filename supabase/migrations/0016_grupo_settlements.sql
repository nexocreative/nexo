-- Ledger de pagos para saldar cuentas en un grupo.
--
-- Con el algoritmo de simplificación de deudas, un "saldar" entre dos
-- personas puede cancelar deuda que en realidad involucra a un tercero
-- (p.ej. A debe a B, B debe a C, C debe a A: se simplifica a 0 pagos aunque
-- ninguna de esas tres deudas "reales" se pueda marcar individualmente como
-- saldada). Por eso el pago se registra aquí en vez de marcar partes de
-- gastos concretos como saldadas.
create table grupo_settlements (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos(id) on delete cascade not null,
  from_user uuid references next_auth.users(id) not null,
  to_user uuid references next_auth.users(id) not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

alter table grupo_settlements enable row level security;

-- Visible para miembros aceptados del grupo
create policy "grupo_settlements_select" on grupo_settlements
  for select using (
    grupo_id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );

-- Cualquiera de las dos partes puede registrar el pago (igual que el saldar
-- pairwise anterior, que cualquiera podía marcar sin confirmación de la otra
-- persona)
create policy "grupo_settlements_insert" on grupo_settlements
  for insert with check (
    (from_user = next_auth.uid() or to_user = next_auth.uid())
    and grupo_id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );
