-- Tabla para guardar suscripciones Web Push
create table if not exists public.push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  creado_en   timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create index if not exists idx_push_user on public.push_subscriptions(user_id);

-- RLS
alter table public.push_subscriptions enable row level security;

create policy "push: own all"
  on public.push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role puede leer todas (para enviar notificaciones)
create policy "push: service read"
  on public.push_subscriptions for select
  to service_role
  using (true);
