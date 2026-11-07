-- AyudaYa · esquema inicial (flujo del cliente + ofertas)
-- Pegar en Supabase → SQL Editor → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'cliente' check (rol in ('cliente','prestador','admin')),
  nombre text not null,
  celular text not null,
  email text not null,
  direccion text not null,
  barrio text,
  ciudad text not null,
  provincia text not null,
  codigo_postal text,
  indicaciones text,
  acepta_terminos_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles(id) on delete cascade,
  oficio text not null,
  descripcion text not null,
  foto_path text,
  dia date not null,
  turno text not null check (turno in ('8-12','12-16','16-20')),
  estado text not null default 'publicado' check (estado in ('publicado','asignado','en_curso','terminado','cancelado')),
  oferta_elegida uuid,
  puja_cierra_at timestamptz, -- se fija con la primera oferta: primera oferta + 1 hora
  created_at timestamptz not null default now()
);

create table if not exists public.ofertas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  prestador_id uuid not null references public.profiles(id) on delete cascade,
  monto integer not null check (monto > 0),
  nota text,
  created_at timestamptz not null default now(),
  unique (pedido_id, prestador_id)
);

alter table public.pedidos
  add constraint pedidos_oferta_fk foreign key (oferta_elegida) references public.ofertas(id);

alter table public.profiles enable row level security;
alter table public.pedidos  enable row level security;
alter table public.ofertas  enable row level security;

-- profiles: cada uno ve y edita el suyo
create policy "perfil propio (leer)"   on public.profiles for select using (auth.uid() = id);
create policy "perfil propio (crear)"  on public.profiles for insert with check (auth.uid() = id and rol = 'cliente');
create policy "perfil propio (editar)" on public.profiles for update using (auth.uid() = id) with check (rol = 'cliente');

-- pedidos: el cliente ve y gestiona los suyos; los prestadores verán los publicados (panel futuro)
create policy "pedido propio (leer)"   on public.pedidos for select using (auth.uid() = cliente_id);
create policy "pedido propio (crear)"  on public.pedidos for insert with check (auth.uid() = cliente_id);
create policy "pedido propio (editar)" on public.pedidos for update using (auth.uid() = cliente_id);
create policy "prestador ve publicados" on public.pedidos for select
  using (estado = 'publicado' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'prestador'));

-- ofertas: el cliente dueño del pedido las ve; el prestador ve y crea las suyas
create policy "ofertas del pedido propio" on public.ofertas for select
  using (exists (select 1 from public.pedidos pe where pe.id = pedido_id and pe.cliente_id = auth.uid()));
create policy "oferta propia (leer)"  on public.ofertas for select using (auth.uid() = prestador_id);
create policy "oferta propia (crear)" on public.ofertas for insert
  with check (auth.uid() = prestador_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'prestador')
    and exists (select 1 from public.pedidos pe where pe.id = pedido_id and pe.estado = 'publicado'
                and (pe.puja_cierra_at is null or pe.puja_cierra_at > now())));
create policy "oferta propia (editar)" on public.ofertas for update using (auth.uid() = prestador_id);

-- Puja: la cuenta regresiva de 1 hora arranca con la primera oferta
create or replace function public.iniciar_puja() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.pedidos set puja_cierra_at = now() + interval '1 hour'
  where id = new.pedido_id and puja_cierra_at is null;
  return new;
end $$;
create trigger ofertas_iniciar_puja after insert on public.ofertas
  for each row execute function public.iniciar_puja();

-- El cliente solo puede elegir oferta cuando la puja ya cerró
create or replace function public.validar_eleccion() returns trigger
language plpgsql as $$
begin
  if new.oferta_elegida is distinct from old.oferta_elegida and new.oferta_elegida is not null then
    if new.puja_cierra_at is null or new.puja_cierra_at > now() then
      raise exception 'La puja todavía no cerró';
    end if;
  end if;
  if new.puja_cierra_at is distinct from old.puja_cierra_at and auth.uid() is not null then
    raise exception 'No se puede modificar el cierre de la puja';
  end if;
  return new;
end $$;
create trigger pedidos_validar_eleccion before update on public.pedidos
  for each row execute function public.validar_eleccion();

-- Fotos (bucket privado; cada cliente sube en su carpeta <uid>/...)
insert into storage.buckets (id, name, public) values ('fotos','fotos', false) on conflict do nothing;
create policy "subir foto propia" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver foto propia" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
