-- ============================================================
-- LICORERÍA DON DAVID — panel_admin.sql
-- ============================================================
-- Se corre DESPUÉS de schema.sql (el mismo proyecto de Supabase,
-- SQL Editor → New query → pega todo esto → Run).
--
-- Agrega lo necesario para el panel de David y su ayudante:
-- roles de acceso, promociones/carrusel, registro de ventas con
-- método de pago, y los datos de contacto editables.
-- ============================================================

-- --------------------------------------------------------
-- 1. PERFILES — quién es quién dentro del sistema de login
--    que ya trae Supabase (auth.users). No se crea un sistema
--    de login desde cero: cada fila aquí "etiqueta" una cuenta
--    ya existente en auth.users con un nombre y un rol.
-- --------------------------------------------------------
create table if not exists perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null,
  rol        text not null check (rol in ('administrador', 'trabajador')),
  creado_en  timestamptz not null default now()
);

alter table perfiles enable row level security;

-- Cada quien puede leer su propio perfil (para saber su propio rol/nombre).
create policy "Cada uno lee su propio perfil"
  on perfiles for select
  using (id = auth.uid());

-- Función que revisa si el usuario actual es administrador SIN que
-- la política se consulte a sí misma (eso fue justo lo que causó el
-- error 500: una política de "perfiles" que, para decidir, vuelve a
-- leer "perfiles"). SECURITY DEFINER hace que esta función consulte
-- la tabla con permisos elevados por dentro, rompiendo ese ciclo.
create or replace function es_administrador()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol = 'administrador'
  );
$$;

-- Solo un administrador puede ver TODOS los perfiles (necesario
-- para la pantalla de "agregar nuevo trabajador").
create policy "Administrador lee todos los perfiles"
  on perfiles for select
  using (es_administrador());

-- Solo un administrador puede crear perfiles nuevos (dar de alta
-- a un trabajador).
create policy "Administrador crea perfiles"
  on perfiles for insert
  with check (es_administrador());


-- --------------------------------------------------------
-- 2. PRODUCTOS — se agregan los campos para promoción,
--    etiqueta (más vendido/recomendado/nuevo) y carrusel.
-- --------------------------------------------------------
alter table productos add column if not exists precio_oferta numeric(10,2);
alter table productos add column if not exists etiqueta text
  check (etiqueta in ('mas_vendido', 'recomendado', 'nuevo') or etiqueta is null);
alter table productos add column if not exists en_carrusel boolean not null default false;
alter table productos add column if not exists imagen_banner_url text; -- opcional: imagen ancha para el carrusel; si no se llena, se usa imagen_url

-- Cualquier miembro del staff (David o su ayudante, sin
-- distinción) puede agregar, editar o eliminar productos.
create policy "Staff gestiona productos"
  on productos for all
  using (exists (select 1 from perfiles p where p.id = auth.uid()))
  with check (exists (select 1 from perfiles p where p.id = auth.uid()));


-- --------------------------------------------------------
-- 3. PEDIDOS — se agregan los campos para diferenciar pedido
--    de venta concretada, método de pago y captura opcional.
-- --------------------------------------------------------
alter table pedidos add column if not exists estado text not null default 'pendiente'
  check (estado in ('pendiente', 'concretado', 'no_concretado'));
alter table pedidos add column if not exists metodo_pago text
  check (metodo_pago in ('efectivo', 'yape', 'plin') or metodo_pago is null);
alter table pedidos add column if not exists captura_pago_url text;
alter table pedidos add column if not exists registrado_por uuid references perfiles(id);

-- El staff necesita LEER los pedidos para poder registrarlos
-- como venta o no. (La restricción de "el ayudante no ve el
-- total acumulado" no se resuelve aquí a nivel de fila — se
-- resuelve en la pantalla del panel, que simplemente no le
-- muestra el número sumado. RLS controla filas, no sumas.)
create policy "Staff lee pedidos"
  on pedidos for select
  using (exists (select 1 from perfiles p where p.id = auth.uid()));

create policy "Staff actualiza pedidos"
  on pedidos for update
  using (exists (select 1 from perfiles p where p.id = auth.uid()))
  with check (exists (select 1 from perfiles p where p.id = auth.uid()));


-- --------------------------------------------------------
-- 4. CONFIGURACIÓN DEL NEGOCIO — dirección, teléfono, horario.
--    Una sola fila siempre (id=1). Pública para leer (la web
--    la necesita para el menú de contacto); solo el
--    administrador (David) puede editarla.
-- --------------------------------------------------------
create table if not exists configuracion_negocio (
  id         int primary key default 1,
  direccion  text not null,
  telefono   text not null,
  horario    text not null,
  updated_at timestamptz not null default now(),
  constraint solo_una_fila check (id = 1)
);

alter table configuracion_negocio enable row level security;

create policy "Lectura pública de configuración"
  on configuracion_negocio for select
  using (true);

create policy "Solo administrador edita configuración"
  on configuracion_negocio for update
  using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador')
  );

insert into configuracion_negocio (id, direccion, telefono, horario)
values (1, 'Jr. Cajamarca 170, Villa María del Triunfo', '+51 986 708 039', 'Lunes - Domingo | 10:00 AM - 11:00 PM')
on conflict (id) do nothing;


-- --------------------------------------------------------
-- 5. ALMACENAMIENTO — bucket privado para las capturas de pago.
--    "Privado" porque, a diferencia de las fotos de productos
--    (que todo el mundo debe poder ver), una captura de pago
--    puede tener datos de la persona que pagó.
-- --------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('capturas-pago', 'capturas-pago', false)
on conflict (id) do nothing;

create policy "Staff sube capturas de pago"
  on storage.objects for insert
  with check (
    bucket_id = 'capturas-pago'
    and exists (select 1 from perfiles p where p.id = auth.uid())
  );

create policy "Staff ve capturas de pago"
  on storage.objects for select
  using (
    bucket_id = 'capturas-pago'
    and exists (select 1 from perfiles p where p.id = auth.uid())
  );
