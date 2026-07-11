-- Grupos de gasto compartido
create table grupos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references next_auth.users(id) not null,
  created_at timestamptz default now()
);

-- Miembros de cada grupo (con estado de invitación)
create table grupo_miembros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos(id) on delete cascade not null,
  user_id uuid references next_auth.users(id) not null,
  invited_by uuid references next_auth.users(id) not null,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at timestamptz default now(),
  unique(grupo_id, user_id)
);

-- Gastos del grupo
create table grupo_gastos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos(id) on delete cascade not null,
  paid_by uuid references next_auth.users(id) not null,
  description text not null,
  amount numeric not null check (amount > 0),
  occurred_at date not null default current_date,
  created_at timestamptz default now()
);

-- Parte de cada participante en un gasto
create table grupo_gasto_partes (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid references grupo_gastos(id) on delete cascade not null,
  user_id uuid references next_auth.users(id) not null,
  amount numeric not null,
  settled boolean not null default false,
  settled_at timestamptz,
  unique(gasto_id, user_id)
);

-- RLS
alter table grupos enable row level security;
alter table grupo_miembros enable row level security;
alter table grupo_gastos enable row level security;
alter table grupo_gasto_partes enable row level security;

-- grupos: visible para miembros aceptados; solo el creador puede borrar
create policy "grupos_select" on grupos
  for select using (
    id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );
create policy "grupos_insert" on grupos
  for insert with check (created_by = next_auth.uid());
create policy "grupos_delete" on grupos
  for delete using (created_by = next_auth.uid());

-- grupo_miembros: visible para miembros del grupo (pending o accepted)
create policy "grupo_miembros_select" on grupo_miembros
  for select using (
    user_id = next_auth.uid()
    or grupo_id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );
create policy "grupo_miembros_insert" on grupo_miembros
  for insert with check (
    invited_by = next_auth.uid()
    and grupo_id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );
create policy "grupo_miembros_update" on grupo_miembros
  for update using (user_id = next_auth.uid());
create policy "grupo_miembros_delete" on grupo_miembros
  for delete using (user_id = next_auth.uid());

-- grupo_gastos: visible para miembros aceptados; cualquier miembro puede insertar/borrar sus propios
create policy "grupo_gastos_select" on grupo_gastos
  for select using (
    grupo_id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );
create policy "grupo_gastos_insert" on grupo_gastos
  for insert with check (
    paid_by = next_auth.uid()
    and grupo_id in (
      select grupo_id from grupo_miembros
      where user_id = next_auth.uid() and status = 'accepted'
    )
  );
create policy "grupo_gastos_delete" on grupo_gastos
  for delete using (paid_by = next_auth.uid());

-- grupo_gasto_partes: visible para miembros aceptados del grupo del gasto
create policy "grupo_gasto_partes_select" on grupo_gasto_partes
  for select using (
    gasto_id in (
      select id from grupo_gastos gg
      where gg.grupo_id in (
        select grupo_id from grupo_miembros
        where user_id = next_auth.uid() and status = 'accepted'
      )
    )
  );
create policy "grupo_gasto_partes_insert" on grupo_gasto_partes
  for insert with check (
    gasto_id in (
      select id from grupo_gastos gg
      where gg.grupo_id in (
        select grupo_id from grupo_miembros
        where user_id = next_auth.uid() and status = 'accepted'
      )
    )
  );
create policy "grupo_gasto_partes_update" on grupo_gasto_partes
  for update using (
    gasto_id in (
      select id from grupo_gastos gg
      where gg.grupo_id in (
        select grupo_id from grupo_miembros
        where user_id = next_auth.uid() and status = 'accepted'
      )
    )
  );
