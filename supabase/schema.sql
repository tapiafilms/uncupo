-- ============================================================
-- UnCupo — Schema completo v1.0
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- EXTENSIONES
-- ──────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ──────────────────────────────────────────────────────────
-- ENUM TYPES
-- ──────────────────────────────────────────────────────────
create type trip_state as enum (
  'publicado', 'confirmado', 'en_camino',
  'en_destino', 'finalizado', 'cancelado'
);

create type passenger_state as enum (
  'reservado', 'en_camino', 'en_el_punto',
  'en_viaje', 'llego', 'pago_confirmado'
);

create type notification_type as enum (
  'nueva_reserva', 'reserva_cancelada', 'viaje_iniciado',
  'viaje_finalizado', 'pago_confirmado', 'nueva_alerta',
  'calificacion_recibida'
);


-- ──────────────────────────────────────────────────────────
-- TABLA: users
-- Extiende auth.users de Supabase
-- ──────────────────────────────────────────────────────────
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  nombre              text not null default '',
  telefono            text not null default '',
  foto_url            text,
  nivel_confianza     smallint not null default 1 check (nivel_confianza between 1 and 5),
  calificacion_promedio numeric(3,2) not null default 0 check (calificacion_promedio between 0 and 5),
  total_viajes        integer not null default 0,
  creado_en           timestamptz not null default now()
);

comment on table public.users is 'Perfiles de usuarios — uno por auth.user';


-- ──────────────────────────────────────────────────────────
-- TABLA: vehiculos
-- ──────────────────────────────────────────────────────────
create table public.vehiculos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  patente     text not null,
  marca       text not null default '',
  modelo      text not null default '',
  color       text not null default '',
  foto_url    text,
  verificado  boolean not null default false,

  constraint vehiculos_patente_unique unique (patente)
);

create index idx_vehiculos_user on public.vehiculos(user_id);


-- ──────────────────────────────────────────────────────────
-- TABLA: viajes
-- ──────────────────────────────────────────────────────────
create table public.viajes (
  id                  uuid primary key default uuid_generate_v4(),
  chofer_id           uuid not null references public.users(id) on delete cascade,
  vehiculo_id         uuid references public.vehiculos(id) on delete set null,

  origen              text not null,
  destino             text not null,
  lat_origen          double precision,
  lng_origen          double precision,
  lat_destino         double precision,
  lng_destino         double precision,

  fecha_hora          timestamptz not null,
  cupos_total         smallint not null check (cupos_total between 1 and 8),
  cupos_disponibles   smallint not null check (cupos_disponibles >= 0),
  precio_cupo         integer not null check (precio_cupo > 0),

  estado              trip_state not null default 'publicado',
  notas               text,
  creado_en           timestamptz not null default now(),

  constraint cupos_check check (cupos_disponibles <= cupos_total)
);

create index idx_viajes_chofer     on public.viajes(chofer_id);
create index idx_viajes_fecha      on public.viajes(fecha_hora);
create index idx_viajes_estado     on public.viajes(estado);
create index idx_viajes_origen     on public.viajes(origen);
create index idx_viajes_destino    on public.viajes(destino);

comment on table public.viajes is 'Viajes publicados por choferes';


-- ──────────────────────────────────────────────────────────
-- TABLA: reservas
-- ──────────────────────────────────────────────────────────
create table public.reservas (
  id              uuid primary key default uuid_generate_v4(),
  viaje_id        uuid not null references public.viajes(id) on delete cascade,
  pasajero_id     uuid not null references public.users(id) on delete cascade,
  estado_pasajero passenger_state not null default 'reservado',
  pago_confirmado boolean not null default false,
  creado_en       timestamptz not null default now(),

  -- Un pasajero sólo puede tener una reserva activa por viaje
  constraint reservas_unique_pasajero_viaje unique (viaje_id, pasajero_id)
);

create index idx_reservas_viaje    on public.reservas(viaje_id);
create index idx_reservas_pasajero on public.reservas(pasajero_id);

comment on table public.reservas is 'Cupos reservados por pasajeros';


-- ──────────────────────────────────────────────────────────
-- TABLA: alertas
-- ──────────────────────────────────────────────────────────
create table public.alertas (
  id          uuid primary key default uuid_generate_v4(),
  pasajero_id uuid not null references public.users(id) on delete cascade,
  origen      text not null,
  destino     text not null,
  fecha_min   date,
  fecha_max   date,
  hora_min    time,
  hora_max    time,
  precio_max  integer,
  activa      boolean not null default true
);

create index idx_alertas_pasajero on public.alertas(pasajero_id);
create index idx_alertas_activa   on public.alertas(activa) where activa = true;


-- ──────────────────────────────────────────────────────────
-- TABLA: calificaciones
-- ──────────────────────────────────────────────────────────
create table public.calificaciones (
  id          uuid primary key default uuid_generate_v4(),
  viaje_id    uuid not null references public.viajes(id) on delete cascade,
  de_user_id  uuid not null references public.users(id) on delete cascade,
  a_user_id   uuid not null references public.users(id) on delete cascade,
  estrellas   smallint not null check (estrellas between 1 and 5),
  comentario  text,
  creado_en   timestamptz not null default now(),

  -- Una calificación por par (viaje, emisor, receptor)
  constraint calificaciones_unique unique (viaje_id, de_user_id, a_user_id)
);

create index idx_cals_a_user on public.calificaciones(a_user_id);
create index idx_cals_viaje  on public.calificaciones(viaje_id);


-- ──────────────────────────────────────────────────────────
-- TABLA: notificaciones
-- ──────────────────────────────────────────────────────────
create table public.notificaciones (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.users(id) on delete cascade,
  tipo      notification_type not null,
  titulo    text not null,
  mensaje   text not null,
  leido     boolean not null default false,
  creado_en timestamptz not null default now()
);

create index idx_notifs_user  on public.notificaciones(user_id);
create index idx_notifs_leido on public.notificaciones(leido) where leido = false;


-- ══════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ══════════════════════════════════════════════════════════

-- ── Trigger: nuevo usuario auth → crear perfil public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, telefono)
  values (
    new.id,
    coalesce(new.phone, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Función: actualizar cupos_disponibles al insertar/cancelar reserva
create or replace function public.update_cupos_disponibles()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    -- Decrementar cupo
    update public.viajes
    set cupos_disponibles = cupos_disponibles - 1
    where id = NEW.viaje_id
      and cupos_disponibles > 0;

    if not found then
      raise exception 'No hay cupos disponibles en este viaje';
    end if;

  elsif TG_OP = 'DELETE' then
    -- Restaurar cupo si la reserva era activa (no pago_confirmado)
    if OLD.pago_confirmado = false then
      update public.viajes
      set cupos_disponibles = cupos_disponibles + 1
      where id = OLD.viaje_id
        and cupos_disponibles < cupos_total;
    end if;
  end if;

  return NEW;
end;
$$;

create trigger trg_reserva_insert
  after insert on public.reservas
  for each row execute procedure public.update_cupos_disponibles();

create trigger trg_reserva_delete
  after delete on public.reservas
  for each row execute procedure public.update_cupos_disponibles();


-- ── Función: recalcular calificacion_promedio tras nueva calificación
create or replace function public.recalculate_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users
  set
    calificacion_promedio = (
      select round(avg(estrellas)::numeric, 2)
      from public.calificaciones
      where a_user_id = NEW.a_user_id
    ),
    total_viajes = (
      select count(distinct viaje_id)
      from public.calificaciones
      where a_user_id = NEW.a_user_id
    )
  where id = NEW.a_user_id;

  return NEW;
end;
$$;

create trigger trg_calificacion_insert
  after insert on public.calificaciones
  for each row execute procedure public.recalculate_rating();


-- ── Función: validar que pasajero no tenga doble reserva en mismo horario
create or replace function public.check_reserva_conflict()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  viaje_nuevo record;
begin
  select fecha_hora into viaje_nuevo
  from public.viajes
  where id = NEW.viaje_id;

  -- Revisar si existe otra reserva del mismo pasajero en ±2h del mismo horario
  if exists (
    select 1
    from public.reservas r
    join public.viajes v on v.id = r.viaje_id
    where r.pasajero_id = NEW.pasajero_id
      and r.id != NEW.id
      and v.estado not in ('cancelado', 'finalizado')
      and abs(extract(epoch from (v.fecha_hora - viaje_nuevo.fecha_hora))) < 7200
  ) then
    raise exception 'El pasajero ya tiene una reserva en ese horario';
  end if;

  return NEW;
end;
$$;

create trigger trg_check_reserva_conflict
  before insert on public.reservas
  for each row execute procedure public.check_reserva_conflict();


-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════

alter table public.users          enable row level security;
alter table public.vehiculos       enable row level security;
alter table public.viajes          enable row level security;
alter table public.reservas        enable row level security;
alter table public.alertas         enable row level security;
alter table public.calificaciones  enable row level security;
alter table public.notificaciones  enable row level security;


-- ── users ────────────────────────────────────────────────
-- SELECT: cualquier usuario autenticado puede leer perfiles
create policy "users: public read"
  on public.users for select
  to authenticated
  using (true);

-- INSERT: sólo el propio usuario crea su perfil (o trigger)
create policy "users: own insert"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

-- UPDATE: sólo el propio usuario
create policy "users: own update"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── vehiculos ────────────────────────────────────────────
create policy "vehiculos: public read"
  on public.vehiculos for select
  to authenticated
  using (true);

create policy "vehiculos: own write"
  on public.vehiculos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vehiculos: own update"
  on public.vehiculos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vehiculos: own delete"
  on public.vehiculos for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── viajes ───────────────────────────────────────────────
-- SELECT: todos pueden ver viajes activos
create policy "viajes: public read"
  on public.viajes for select
  to authenticated
  using (true);

-- INSERT: sólo choferes autenticados
create policy "viajes: chofer insert"
  on public.viajes for insert
  to authenticated
  with check (auth.uid() = chofer_id);

-- UPDATE: sólo el chofer del viaje
create policy "viajes: chofer update"
  on public.viajes for update
  to authenticated
  using (auth.uid() = chofer_id)
  with check (auth.uid() = chofer_id);

-- DELETE: sólo el chofer (y sólo si no hay reservas activas — validado en app)
create policy "viajes: chofer delete"
  on public.viajes for delete
  to authenticated
  using (auth.uid() = chofer_id);


-- ── reservas ─────────────────────────────────────────────
-- SELECT: el pasajero ve sus reservas; el chofer ve las de su viaje
create policy "reservas: pasajero or chofer read"
  on public.reservas for select
  to authenticated
  using (
    auth.uid() = pasajero_id
    or exists (
      select 1 from public.viajes v
      where v.id = viaje_id and v.chofer_id = auth.uid()
    )
  );

-- INSERT: sólo el pasajero crea su propia reserva
create policy "reservas: pasajero insert"
  on public.reservas for insert
  to authenticated
  with check (auth.uid() = pasajero_id);

-- UPDATE: pasajero actualiza su estado; chofer confirma pago
create policy "reservas: pasajero or chofer update"
  on public.reservas for update
  to authenticated
  using (
    auth.uid() = pasajero_id
    or exists (
      select 1 from public.viajes v
      where v.id = viaje_id and v.chofer_id = auth.uid()
    )
  );

-- DELETE: pasajero cancela su reserva
create policy "reservas: pasajero delete"
  on public.reservas for delete
  to authenticated
  using (auth.uid() = pasajero_id);


-- ── alertas ──────────────────────────────────────────────
create policy "alertas: own all"
  on public.alertas for all
  to authenticated
  using (auth.uid() = pasajero_id)
  with check (auth.uid() = pasajero_id);


-- ── calificaciones ───────────────────────────────────────
create policy "calificaciones: public read"
  on public.calificaciones for select
  to authenticated
  using (true);

create policy "calificaciones: own insert"
  on public.calificaciones for insert
  to authenticated
  with check (auth.uid() = de_user_id);


-- ── notificaciones ───────────────────────────────────────
create policy "notificaciones: own all"
  on public.notificaciones for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- REALTIME: activar para tablas con actualizaciones en vivo
-- ══════════════════════════════════════════════════════════
-- Ejecutar en Dashboard → Database → Replication → Tables
-- O con:
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.viajes,
    public.reservas,
    public.notificaciones;
commit;
