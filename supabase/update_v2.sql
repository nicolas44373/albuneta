-- 1. Agregar columna 'province' a la tabla profiles
alter table public.profiles add column if not exists province text;

-- 2. Crear tabla de puntos de venta (kioscos/locales)
create table if not exists public.sale_points (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  province text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  packet_price numeric,
  album_price numeric,
  has_stock boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Habilitar seguridad de nivel de fila (RLS) en sale_points
alter table public.sale_points enable row level security;

-- 4. Crear políticas RLS para sale_points
drop policy if exists "Cualquiera puede leer puntos de venta" on public.sale_points;
create policy "Cualquiera puede leer puntos de venta" on public.sale_points
  for select using (true);

drop policy if exists "Usuarios autenticados pueden registrar puntos de venta" on public.sale_points;
create policy "Usuarios autenticados pueden registrar puntos de venta" on public.sale_points
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Usuarios autenticados pueden actualizar puntos de venta" on public.sale_points;
create policy "Usuarios autenticados pueden actualizar puntos de venta" on public.sale_points
  for update with check (auth.role() = 'authenticated');

-- 5. Actualizar la función find_matches para filtrar por misma provincia
drop function if exists public.find_matches(uuid);
create or replace function public.find_matches(for_user_id uuid)
returns table (
  other_user_id    uuid,
  username         text,
  avatar_url       text,
  city             text,
  province         text,
  reputation       integer,
  trades_completed integer,
  stickers_i_give    integer[],
  stickers_i_receive integer[],
  match_count      integer,
  match_percentage integer
) as $$
declare
  v_user_province text;
begin
  -- Obtener la provincia del usuario que consulta
  select p.province into v_user_province
  from public.profiles p
  where p.id = for_user_id;

  return query
  with
    my_haves as (
      select us.sticker_id, s.number
      from public.user_stickers us
      join public.stickers s on s.id = us.sticker_id
      where us.user_id = for_user_id
        and us.status = 'have'
        and us.quantity > 0
    ),
    my_needs as (
      select us.sticker_id, s.number
      from public.user_stickers us
      join public.stickers s on s.id = us.sticker_id
      where us.user_id = for_user_id
        and us.status = 'need'
    ),
    -- figuritas mías que el otro necesita
    i_give as (
      select
        us.user_id as other_user_id,
        array_agg(mh.number order by mh.number) as numbers
      from public.user_stickers us
      join my_haves mh on mh.sticker_id = us.sticker_id
      where us.user_id != for_user_id
        and us.status = 'need'
      group by us.user_id
    ),
    -- figuritas del otro que yo necesito
    i_receive as (
      select
        us.user_id as other_user_id,
        array_agg(mn.number order by mn.number) as numbers
      from public.user_stickers us
      join my_needs mn on mn.sticker_id = us.sticker_id
      where us.user_id != for_user_id
        and us.status = 'have'
        and us.quantity > 0
      group by us.user_id
    ),
    -- unir ambos lados
    combined as (
      select
        coalesce(ig.other_user_id, ir.other_user_id) as uid,
        coalesce(ig.numbers, array[]::integer[])      as give_nums,
        coalesce(ir.numbers, array[]::integer[])      as recv_nums
      from i_give ig
      full outer join i_receive ir on ir.other_user_id = ig.other_user_id
    )
  select
    p.id,
    p.username,
    p.avatar_url,
    p.city,
    p.province,
    p.reputation,
    p.trades_completed,
    c.give_nums,
    c.recv_nums,
    (coalesce(array_length(c.give_nums, 1), 0) + coalesce(array_length(c.recv_nums, 1), 0)) as match_count,
    least(100,
      (coalesce(array_length(c.give_nums, 1), 0) + coalesce(array_length(c.recv_nums, 1), 0)) * 5
    ) as match_percentage
  from combined c
  join public.profiles p on p.id = c.uid
  where (coalesce(array_length(c.give_nums, 1), 0) + coalesce(array_length(c.recv_nums, 1), 0)) > 0
    -- Filtrar por la misma provincia (si ambos las tienen definidas)
    and (p.province is null or v_user_province is null or p.province = v_user_province)
  order by
    (coalesce(array_length(c.give_nums, 1), 0) > 0 and coalesce(array_length(c.recv_nums, 1), 0) > 0) desc,
    match_count desc;
end;
$$ language plpgsql security definer;

-- 6. Insertar semillas de puntos de venta (kioscos) de figuritas en Argentina
truncate table public.sale_points;

insert into public.sale_points (name, address, province, city, lat, lng, packet_price, album_price, has_stock)
values
  -- CABA
  ('Kiosco El Obelisco', 'Av. Corrientes 1050', 'CABA', 'Ciudad de Buenos Aires', -34.6037, -58.3816, 1200, 5000, true),
  ('Puesto Plaza Italia', 'Av. Santa Fe 4100', 'CABA', 'Ciudad de Buenos Aires', -34.5812, -58.4211, 1200, null, true),
  ('Revistería Florida y Corrientes', 'Florida 500', 'CABA', 'Ciudad de Buenos Aires', -34.6028, -58.3758, 1300, 5500, true),
  ('Kiosco Estación Constitución', 'Brasil 1100', 'CABA', 'Ciudad de Buenos Aires', -34.6278, -58.3812, 1100, 4800, false),
  ('Puesto Cabildo y Juramento', 'Av. Cabildo 2200', 'CABA', 'Ciudad de Buenos Aires', -34.5612, -58.4566, 1200, 5000, true),
  ('Kiosco Rivadavia y Carabobo', 'Av. Rivadavia 6300', 'CABA', 'Ciudad de Buenos Aires', -34.6293, -58.4633, 1250, 5200, true),
  ('Puesto Alto Palermo', 'Av. Santa Fe 3400', 'CABA', 'Ciudad de Buenos Aires', -34.5886, -58.4109, 1300, 5500, true),
  ('Kiosco Rivadavia y Acoyte', 'Av. Rivadavia 5100', 'CABA', 'Ciudad de Buenos Aires', -34.6184, -58.4363, 1200, 5000, true),

  -- Buenos Aires
  ('Kiosco Centro La Plata', 'Calle 8 y 50', 'Buenos Aires', 'La Plata', -34.9212, -57.9544, 1200, 5000, true),
  ('Maxi Kiosco MDQ', 'San Martín 2500', 'Buenos Aires', 'Mar del Plata', -38.0055, -57.5489, 1300, 5500, true),
  ('Kiosco San Isidro', 'Belgrano 300', 'Buenos Aires', 'San Isidro', -34.4716, -58.5284, 1250, 5200, true),
  ('Estación Bahía Kiosco', 'Estomba 100', 'Buenos Aires', 'Bahía Blanca', -38.7183, -62.2662, 1250, null, true),
  ('Kiosco Centro Quilmes', 'Peatonal Rivadavia 150', 'Buenos Aires', 'Quilmes', -34.7245, -58.2524, 1200, 5000, true),
  ('Kiosco Plaza San Martín (SM)', 'Mitre 3800', 'Buenos Aires', 'San Martín', -34.5779, -58.5389, 1200, 4900, true),
  ('Puesto Estación Morón', 'Rivadavia 18000', 'Buenos Aires', 'Morón', -34.6483, -58.6214, 1300, 5200, false),
  ('Kiosco Estación Tigre', 'Av. Cazón 1500', 'Buenos Aires', 'Tigre', -34.4253, -58.5796, 1250, 5100, true),
  ('Kiosco Lanús Centro', 'Av. 9 de Julio 1200', 'Buenos Aires', 'Lanús', -34.6987, -58.3892, 1200, 5000, true),
  ('Puesto Laprida Lomas', 'Peatonal Laprida 200', 'Buenos Aires', 'Lomas de Zamora', -34.7584, -58.4022, 1200, null, true),

  -- Córdoba
  ('Kiosco Plaza San Martín', 'San Jerónimo 100', 'Córdoba', 'Córdoba', -31.4137, -64.1811, 1200, 5000, true),
  ('Maxi Kiosco Nueva Córdoba', 'Rondeau 300', 'Córdoba', 'Córdoba', -31.4258, -64.1869, 1300, 6000, true),
  ('Kiosco Terminal Córdoba', 'Bv. Perón 300', 'Córdoba', 'Córdoba', -31.4158, -64.1722, 1200, null, false),
  ('Kiosco Villa Carlos Paz', 'Av. San Martín 400', 'Córdoba', 'Villa Carlos Paz', -31.4206, -64.4947, 1300, 5500, true),
  ('Kiosco Plaza Roca Río Cuarto', 'Sobremonte 600', 'Córdoba', 'Río Cuarto', -33.1235, -64.3491, 1250, 5100, true),

  -- Santa Fe
  ('Kiosco Peatonal Córdoba', 'Córdoba 1200', 'Santa Fe', 'Rosario', -32.9468, -60.6393, 1200, 5000, true),
  ('Revistería Plaza Pringles', 'Paraguay 800', 'Santa Fe', 'Rosario', -32.9442, -60.6429, 1250, 5300, true),
  ('Kiosco Bv. Gálvez', 'Bv. Gálvez 1500', 'Santa Fe', 'Santa Fe', -31.6385, -60.6974, 1200, null, true),
  ('Kiosco Pellegrini y Corrientes', 'Av. Pellegrini 1400', 'Santa Fe', 'Rosario', -32.9525, -60.6489, 1200, 5000, true),
  ('Puesto Oroño y Córdoba', 'Bv. Oroño 800', 'Santa Fe', 'Rosario', -32.9463, -60.6511, 1250, null, true),

  -- Mendoza
  ('Kiosco Peatonal Sarmiento', 'Sarmiento 100', 'Mendoza', 'Mendoza', -32.8894, -68.8441, 1200, 5000, true),
  ('Puesto Plaza Independencia', 'Patricias Mendocinas 1100', 'Mendoza', 'Mendoza', -32.8898, -68.8448, 1250, null, true),
  ('Kiosco San Rafael Centro', 'Av. Mitre 200', 'Mendoza', 'San Rafael', -34.6176, -68.3299, 1200, 4800, true),

  -- Tucumán
  -- Tucumán (Foco Local)
  ('Kiosco Plaza Independencia Tucumán', '25 de Mayo 50', 'Tucumán', 'San Miguel de Tucumán', -26.8298, -65.2030, 1200, 5000, true),
  ('Sucursal Central / El Bajo', 'Av. Juan B. Justo 960', 'Tucumán', 'San Miguel de Tucumán', -26.8165, -65.1956, 1200, 5000, true),
  ('Sucursal Microcentro', 'Junín 263', 'Tucumán', 'San Miguel de Tucumán', -26.8266, -65.2083, 1200, 5000, true),
  ('Sucursal Sur', 'Av. Colón 582 (esquina La Plata)', 'Tucumán', 'San Miguel de Tucumán', -26.8345, -65.2215, 1200, null, true),
  ('Sucursal Terminal', 'Av. Benjamín Aráoz 108', 'Tucumán', 'San Miguel de Tucumán', -26.8306, -65.1932, 1250, 5200, true),
  ('Sucursal Yerba Buena (Isla)', 'Shopping Portal Tucumán (Av. Belgrano 2226)', 'Tucumán', 'Yerba Buena', -26.8216, -65.2673, 1300, 5500, true),
  ('Estación Terminal Tucumán', 'Av. Brígido Terán 350', 'Tucumán', 'San Miguel de Tucumán', -26.8312, -65.1950, 1250, 5200, true),
  ('Kiosco de la Suipacha', 'Suipacha 400', 'Tucumán', 'San Miguel de Tucumán', -26.8185, -65.2152, 1200, null, true),
  ('Puesto Peatonal Mendoza', 'Mendoza 650', 'Tucumán', 'San Miguel de Tucumán', -26.8272, -65.2075, 1200, 5000, true),
  ('Kiosco Av. Mate de Luna', 'Av. Mate de Luna 2100', 'Tucumán', 'San Miguel de Tucumán', -26.8257, -65.2290, 1250, 5500, true),
  ('Kiosco Barrio Sur', 'General Paz 900', 'Tucumán', 'San Miguel de Tucumán', -26.8340, -65.2120, 1200, null, true),
  ('Kiosco Plaza Urquiza', 'Santa Fe 500', 'Tucumán', 'San Miguel de Tucumán', -26.8175, -65.2044, 1300, 5500, true),
  ('Maxi Kiosco Av. Avellaneda', 'Av. Avellaneda 450', 'Tucumán', 'San Miguel de Tucumán', -26.8252, -65.1945, 1200, 5000, false),
  ('Kiosco Plaza San Martín (Tuc)', 'Chacabuco 700', 'Tucumán', 'San Miguel de Tucumán', -26.8389, -65.2100, 1200, 5100, true),
  ('Kiosco Shopping Portal Tucumán', 'Cariola 1900', 'Tucumán', 'Yerba Buena', -26.8216, -65.2673, 1300, 5600, true),
  ('Kiosco Av. Aconquija 1200', 'Av. Aconquija 1250', 'Tucumán', 'Yerba Buena', -26.8145, -65.2885, 1250, 5300, true),
  ('Kiosco Plaza Marcos Paz', 'Shopping Marcos Paz', 'Tucumán', 'Yerba Buena', -26.8119, -65.2944, 1300, 5500, true),
  ('Kiosco Centro Tafí Viejo', 'Av. Alem 200', 'Tucumán', 'Tafí Viejo', -26.7303, -65.2586, 1200, 5000, true),
  ('Kiosco Plaza Mitre Concepción', 'San Martín 1200', 'Tucumán', 'Concepción', -27.3270, -65.5940, 1200, null, true),
  ('Kiosco Plaza Belgrano BRS', 'Av. Santo Domingo 100', 'Tucumán', 'Banda del Río Salí', -26.8400, -65.1616, 1200, 4800, false),
  ('Kiosco Plaza 9 de Julio Lules', 'Alberdi 150', 'Tucumán', 'Lules', -26.9222, -65.3378, 1200, 5000, true),

  -- Salta
  ('Kiosco Plaza 9 de Julio', 'Caseros 500', 'Salta', 'Salta', -24.7892, -65.4103, 1200, null, true),

  -- Jujuy
  ('Kiosco Plaza Belgrano', 'Belgrano 500', 'Jujuy', 'San Salvador de Jujuy', -24.1858, -65.3045, 1200, 5000, true),

  -- Chaco
  ('Kiosco Central Resistencia', 'Julio A. Roca 100', 'Chaco', 'Resistencia', -27.4514, -58.9866, 1200, 5000, true),

  -- Corrientes
  ('Revistería Peatonal Junín', 'Junín 1000', 'Corrientes', 'Corrientes', -27.4692, -58.8306, 1250, 5100, true),

  -- Misiones
  ('Kiosco Plaza San Martín Posadas', 'Ayacucho 1700', 'Misiones', 'Posadas', -27.3671, -55.8961, 1300, 5500, true),

  -- Entre Ríos
  ('Kiosco Plaza 1° de Mayo', 'Urquiza 1100', 'Entre Ríos', 'Paraná', -31.7331, -60.5298, 1200, 5000, true),

  -- Neuquén
  ('Puesto Monumento San Martín', 'Av. Olascoaga 100', 'Neuquén', 'Neuquén', -38.9516, -68.0591, 1300, 5500, true),

  -- Río Negro
  ('Kiosco Centro Cívico Bariloche', 'Mitre 50', 'Río Negro', 'San Carlos de Bariloche', -41.1335, -71.3103, 1300, 5800, true),

  -- San Juan
  ('Kiosco Plaza 25 de Mayo (SJ)', 'Mendoza Sur 200', 'San Juan', 'San Juan', -31.5375, -68.5251, 1200, 5000, true),

  -- Chubut
  ('Kiosco Centro Comodoro', 'San Martín 400', 'Chubut', 'Comodoro Rivadavia', -45.8647, -67.4808, 1300, null, true),

  -- Santa Cruz
  ('Kiosco Néstor Kirchner', 'Av. Presidente Néstor Kirchner 800', 'Santa Cruz', 'Río Gallegos', -51.6226, -69.2181, 1300, null, true),

  -- Tierra del Fuego
  ('Kiosco Fin del Mundo', 'Av. San Martín 600', 'Tierra del Fuego', 'Ushuaia', -54.8064, -68.3030, 1400, 6000, true),

  -- San Luis
  ('Kiosco Plaza Pringles SL', 'Rivadavia 700', 'San Luis', 'San Luis', -33.3015, -66.3379, 1200, 5000, true),

  -- La Pampa
  ('Kiosco Plaza San Martín SR', 'Av. San Martín 150', 'La Pampa', 'Santa Rosa', -36.6203, -64.2912, 1200, null, true),

  -- Santiago del Estero
  ('Kiosco Plaza Libertad SE', 'Independencia 200', 'Santiago del Estero', 'Santiago del Estero', -27.7877, -64.2589, 1200, 4900, true),

  -- Catamarca
  ('Kiosco Plaza 25 de Mayo Cat', 'Sarmiento 600', 'Catamarca', 'San Fernando del Valle de Catamarca', -28.4690, -65.7792, 1200, null, true),

  -- La Rioja
  ('Kiosco Plaza 25 de Mayo LR', 'San Nicolas de Bari 500', 'La Rioja', 'La Rioja', -29.4131, -66.8558, 1200, null, true),

  -- Formosa
  ('Kiosco Plaza San Martín For', 'Av. 25 de Mayo 400', 'Formosa', 'Formosa', -26.1849, -58.1731, 1200, 5000, true);
