-- =========================================================
-- Feudo · Esquema de la base de datos (Supabase / PostgreSQL)
-- Ejecutar en orden sobre una base de datos vacía.
-- =========================================================


-- ---------------------------------------------------------
-- 1. Tipo enumerado de roles
-- ---------------------------------------------------------
create type public.rol as enum ('USUARIO', 'MODERADOR', 'ADMIN');


-- ---------------------------------------------------------
-- 2. Perfiles (amplía auth.users de Supabase Auth)
-- ---------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null unique check (char_length(nombre) between 3 and 30),
  fecha_registro timestamptz not null default now(),
  baneado boolean not null default false,
  rol public.rol not null default 'USUARIO'
);

alter table public.perfiles enable row level security;


-- ---------------------------------------------------------
-- 3. Trigger: crea el perfil al registrarse un usuario
-- ---------------------------------------------------------
create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');
  return new;
end;
$$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil();


-- ---------------------------------------------------------
-- 4. Funciones auxiliares de permisos
-- ---------------------------------------------------------
create function public.rol_actual()
returns public.rol
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

create function public.esta_baneado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select baneado from public.perfiles where id = auth.uid()),
    true
  );
$$;


-- ---------------------------------------------------------
-- 5. Políticas RLS de perfiles
-- ---------------------------------------------------------
create policy "Perfiles visibles para usuarios autenticados"
on public.perfiles
for select
to authenticated
using (true);


-- ---------------------------------------------------------
-- 6. Posts
-- ---------------------------------------------------------
create table public.posts (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  contenido text not null check (char_length(contenido) between 1 and 2000),
  fecha timestamptz not null default now(),
  oculto boolean not null default false
);

create index posts_fecha_idx on public.posts (fecha desc);

alter table public.posts enable row level security;

create policy "Ver posts visibles, o todos si eres moderador o admin"
on public.posts
for select
to authenticated
using (
  oculto = false
  or public.rol_actual() in ('MODERADOR', 'ADMIN')
);

create policy "Publicar posts propios si no estás baneado"
on public.posts
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  and not public.esta_baneado()
);


-- ---------------------------------------------------------
-- 7. Comentarios
-- ---------------------------------------------------------
create table public.comentarios (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  fecha timestamptz not null default now(),
  oculto boolean not null default false
);

create index comentarios_post_id_idx on public.comentarios (post_id);

alter table public.comentarios enable row level security;

create policy "Ver comentarios visibles, o todos si eres moderador o admin"
on public.comentarios
for select
to authenticated
using (
  oculto = false
  or public.rol_actual() in ('MODERADOR', 'ADMIN')
);

create policy "Comentar como uno mismo si no estás baneado"
on public.comentarios
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  and not public.esta_baneado()
);


-- ---------------------------------------------------------
-- 8. Me gusta
-- ---------------------------------------------------------
create table public.me_gusta (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  fecha timestamptz not null default now(),
  unique (post_id, usuario_id)
);

alter table public.me_gusta enable row level security;

create policy "Ver todos los me gusta"
on public.me_gusta
for select
to authenticated
using (true);

create policy "Dar me gusta como uno mismo si no estás baneado"
on public.me_gusta
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  and not public.esta_baneado()
);

create policy "Quitar tu propio me gusta si no estás baneado"
on public.me_gusta
for delete
to authenticated
using (
  usuario_id = auth.uid()
  and not public.esta_baneado()
);


-- ---------------------------------------------------------
-- 9. Funciones de moderación (MODERADOR y ADMIN)
-- ---------------------------------------------------------
create function public.cambiar_visibilidad_post(p_post_id bigint, p_oculto boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.rol_actual(), 'USUARIO') not in ('MODERADOR', 'ADMIN')
     or public.esta_baneado() then
    raise exception 'No tienes permiso para moderar';
  end if;

  update public.posts set oculto = p_oculto where id = p_post_id;

  if not found then
    raise exception 'El post no existe';
  end if;
end;
$$;

create function public.cambiar_visibilidad_comentario(p_comentario_id bigint, p_oculto boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.rol_actual(), 'USUARIO') not in ('MODERADOR', 'ADMIN')
     or public.esta_baneado() then
    raise exception 'No tienes permiso para moderar';
  end if;

  update public.comentarios set oculto = p_oculto where id = p_comentario_id;

  if not found then
    raise exception 'El comentario no existe';
  end if;
end;
$$;


-- ---------------------------------------------------------
-- 10. Funciones de administración (solo ADMIN)
-- ---------------------------------------------------------
create function public.cambiar_baneo(p_usuario_id uuid, p_baneado boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.rol_actual(), 'USUARIO') <> 'ADMIN'
     or public.esta_baneado() then
    raise exception 'Solo un administrador puede banear usuarios';
  end if;

  if p_usuario_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio estado de baneo';
  end if;

  update public.perfiles set baneado = p_baneado where id = p_usuario_id;

  if not found then
    raise exception 'El usuario no existe';
  end if;
end;
$$;

create function public.cambiar_rol(p_usuario_id uuid, p_rol public.rol)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.rol_actual(), 'USUARIO') <> 'ADMIN'
     or public.esta_baneado() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;

  if p_usuario_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;

  update public.perfiles set rol = p_rol where id = p_usuario_id;

  if not found then
    raise exception 'El usuario no existe';
  end if;
end;
$$;


-- ---------------------------------------------------------
-- 11. Primer administrador (ejecutar a mano tras registrarse)
-- ---------------------------------------------------------
-- update public.perfiles set rol = 'ADMIN' where nombre = 'NOMBRE_DEL_USUARIO';