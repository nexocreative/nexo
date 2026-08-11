-- Token de push (Expo) del dispositivo móvil del usuario, para notificarle
-- invitaciones y gastos de grupo aunque tenga la app cerrada. Un usuario
-- puede tener varios dispositivos; guardamos el último token conocido por
-- simplicidad (suficiente para un solo dispositivo móvil por persona).
alter table public.profiles add column if not exists push_token text;
