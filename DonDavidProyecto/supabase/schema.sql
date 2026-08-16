-- ============================================================
-- LICORERÍA DON DAVID — esquema de Supabase
-- ============================================================
-- Cómo usarlo: entra a tu proyecto de Supabase → SQL Editor →
-- pega TODO este archivo → Run. Se crean 2 tablas:
--
--   productos  → el catálogo. Público puede LEER (para que la
--                web lo muestre), nadie puede escribir desde
--                el navegador. Tú lo editas desde el Table
--                Editor de Supabase (esa es tu "panel admin",
--                sin tener que programar uno).
--
--   pedidos    → un registro de cada pedido enviado por
--                WhatsApp desde el carrito (para que quede un
--                historial, ya que WhatsApp no lo guarda
--                ordenado). Público puede INSERTAR, nadie puede
--                LEER desde el navegador — solo tú, desde el
--                dashboard.
--
-- No se guarda stock/inventario a propósito: el alcance del
-- proyecto excluye control de inventario, así que esta tabla
-- es solo catálogo + precio, no existencias.
-- ============================================================

-- --------------------------------------------------------
-- TABLA: productos
-- --------------------------------------------------------
create table if not exists productos (
  id          text primary key,              -- ej: 'whisky', 'vino-malbec-2023'
  nombre      text not null,
  categoria   text not null check (categoria in (
                'whisky','vino','cerveza','pisco','ron','vodka',
                'tequila','espumante','energizante','gaseosa','agua'
              )),
  precio      numeric(10,2) not null check (precio >= 0),
  descripcion text,
  imagen_url  text,
  destacado   boolean not null default false, -- para marcar "más vendido" / "recomendado"
  activo      boolean not null default true,  -- false = se oculta de la web sin borrarlo
  creado_en   timestamptz not null default now()
);

alter table productos enable row level security;

-- Cualquier visitante de la web puede LEER productos activos.
create policy "Lectura pública de productos activos"
  on productos for select
  using (activo = true);

-- (No hay política de insert/update/delete para el rol público:
--  eso significa que nadie puede modificar el catálogo desde el
--  navegador. Tú sí puedes, desde el Table Editor de Supabase,
--  porque el dashboard usa tu propia sesión, no la anon key.)


-- --------------------------------------------------------
-- TABLA: pedidos
-- --------------------------------------------------------
create table if not exists pedidos (
  id         uuid primary key default gen_random_uuid(),
  items      jsonb not null,   -- [{ id, nombre, precio, cantidad }, ...]
  total      numeric(10,2) not null,
  creado_en  timestamptz not null default now()
);

alter table pedidos enable row level security;

-- Cualquier visitante puede INSERTAR un pedido (se dispara justo
-- antes de abrir WhatsApp) pero nadie puede LEER pedidos ajenos.
create policy "Cualquiera puede registrar un pedido"
  on pedidos for insert
  with check (true);

-- Para ver tus pedidos, hazlo desde el Table Editor de Supabase
-- (tu sesión de dashboard no está sujeta a esta política).


-- --------------------------------------------------------
-- DATOS INICIALES (los mismos 4 productos que ya tenía la web)
-- --------------------------------------------------------
insert into productos (id, nombre, categoria, precio, descripcion, imagen_url, destacado)
values
  ('whisky',  'Whisky Premium',    'whisky',  120.00, 'Whisky seleccionado de excelente calidad, perfecto para celebraciones y reuniones.', '/imagenes/wizky.jpg',   true),
  ('vino',    'Vino Reserva',      'vino',    60.00,  'Vino seleccionado de excelente calidad, perfecto para cenas y momentos especiales.',  '/imagenes/vinoki.jpg',  true),
  ('cerveza', 'Cerveza Artesanal', 'cerveza', 15.00,  'Cerveza artesanal con excelente sabor, ideal para compartir con amigos.',              '/imagenes/cerbeza.jpg', false),
  ('pisco',   'Pisco Peruano',     'pisco',   50.00,  'Pisco peruano de calidad, perfecto para preparar cócteles.',                            '/imagenes/piscano.png', false)
on conflict (id) do nothing;
