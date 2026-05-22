-- =============================================
-- ALBUNETA - Schema completo
-- Pegá esto en el SQL Editor de Supabase
-- =============================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLAS
-- =============================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  city text,
  reputation integer default 0 not null,
  trades_completed integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table public.albums (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  year integer not null,
  total_stickers integer not null,
  image_url text,
  created_at timestamp with time zone default now() not null
);

create table public.stickers (
  id uuid default uuid_generate_v4() primary key,
  album_id uuid references public.albums on delete cascade not null,
  number integer not null,
  player_name text,
  team text,
  section text,
  rarity text default 'common' check (rarity in ('common', 'rare', 'special', 'foil')),
  unique(album_id, number)
);

create table public.user_stickers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  sticker_id uuid references public.stickers on delete cascade not null,
  quantity integer default 1 not null check (quantity >= 0),
  status text not null check (status in ('have', 'need')),
  unique(user_id, sticker_id, status)
);

create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user_a uuid references public.profiles on delete cascade not null,
  user_b uuid references public.profiles on delete cascade not null,
  match_percentage integer default 0 not null,
  stickers_a_to_b jsonb default '[]'::jsonb,
  stickers_b_to_a jsonb default '[]'::jsonb,
  status text default 'pending' check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  created_at timestamp with time zone default now() not null,
  unique(user_a, user_b)
);

create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches on delete cascade unique not null,
  created_at timestamp with time zone default now() not null
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  rater_id uuid references public.profiles on delete cascade not null,
  rated_id uuid references public.profiles on delete cascade not null,
  match_id uuid references public.matches on delete cascade not null,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamp with time zone default now() not null,
  unique(rater_id, match_id)
);

-- =============================================
-- INDEXES
-- =============================================

create index idx_user_stickers_user_id on public.user_stickers(user_id);
create index idx_user_stickers_sticker_id on public.user_stickers(sticker_id);
create index idx_user_stickers_user_status on public.user_stickers(user_id, status);
create index idx_matches_user_a on public.matches(user_a);
create index idx_matches_user_b on public.matches(user_b);
create index idx_matches_status on public.matches(status);
create index idx_messages_chat_id on public.messages(chat_id);
create index idx_stickers_album_id on public.stickers(album_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.stickers enable row level security;
alter table public.user_stickers enable row level security;
alter table public.matches enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;

-- Profiles: cualquiera puede leer, solo el dueño puede escribir
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Albums y stickers: solo lectura pública
create policy "Albums are public" on public.albums
  for select using (true);
create policy "Stickers are public" on public.stickers
  for select using (true);

-- User stickers: lectura pública, escritura solo dueño
create policy "User stickers are viewable by everyone" on public.user_stickers
  for select using (true);
create policy "Users can manage own stickers" on public.user_stickers
  for all using (auth.uid() = user_id);

-- Matches: solo los participantes
create policy "Users can see their matches" on public.matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "Users can create matches" on public.matches
  for insert with check (auth.uid() = user_a);
create policy "Participants can update matches" on public.matches
  for update using (auth.uid() = user_a or auth.uid() = user_b);

-- Chats: solo los participantes del match
create policy "Chat participants can read chats" on public.chats
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = chats.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );
create policy "System can create chats" on public.chats
  for insert with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Messages: solo los participantes del chat
create policy "Chat participants can read messages" on public.messages
  for select using (
    exists (
      select 1 from public.chats c
      join public.matches m on m.id = c.match_id
      where c.id = messages.chat_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );
create policy "Chat participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and exists (
      select 1 from public.chats c
      join public.matches m on m.id = c.match_id
      where c.id = messages.chat_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Ratings: lectura pública, solo se puede calificar si el intercambio fue completado
create policy "Ratings are viewable by everyone" on public.ratings
  for select using (true);
create policy "Users can rate after completed trade" on public.ratings
  for insert with check (
    auth.uid() = rater_id
    and exists (
      select 1 from public.matches m
      where m.id = ratings.match_id
      and m.status = 'completed'
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_base_username text;
  v_username text;
  v_suffix integer := 1;
begin
  v_base_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_username := v_base_username;
  
  -- Si el nombre de usuario ya existe, le agregamos un número al final hasta que sea único
  while exists (select 1 from public.profiles where username = v_username) loop
    v_username := v_base_username || v_suffix::text;
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    v_username,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Recalcular reputación cuando llega una nueva calificación
create or replace function public.update_reputation()
returns trigger as $$
begin
  update public.profiles
  set
    reputation = (
      select round(coalesce(avg(score), 0) * 20)::integer
      from public.ratings
      where rated_id = new.rated_id
    ),
    trades_completed = (
      select count(*) from public.matches
      where status = 'completed'
      and (user_a = new.rated_id or user_b = new.rated_id)
    )
  where id = new.rated_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_rating_added
  after insert on public.ratings
  for each row execute procedure public.update_reputation();

-- =============================================
-- FUNCIÓN DE MATCHING
-- Devuelve todos los usuarios con los que hay intercambio posible:
-- yo tengo lo que ellos necesitan Y ellos tienen lo que yo necesito
-- =============================================

create or replace function public.find_matches(for_user_id uuid)
returns table (
  other_user_id    uuid,
  username         text,
  avatar_url       text,
  city             text,
  reputation       integer,
  trades_completed integer,
  stickers_i_give    integer[],
  stickers_i_receive integer[],
  match_count      integer,
  match_percentage integer
) as $$
begin
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
    -- unir ambos lados: aparece si hay al menos una figura en cualquier dirección
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
  where coalesce(array_length(c.give_nums, 1), 0) + coalesce(array_length(c.recv_nums, 1), 0) > 0
  -- mutuos primero, luego los parciales
  order by
    (coalesce(array_length(c.give_nums, 1), 0) > 0 and coalesce(array_length(c.recv_nums, 1), 0) > 0) desc,
    match_count desc;
end;
$$ language plpgsql security definer;

-- =============================================
-- SEED: Álbum FIFA World Cup 2026
-- 20 intro + 48 selecciones × 20 = 980 principales
-- + 14 Coca-Cola (offset 1000) = 994 total
-- =============================================

insert into public.albums (id, name, year, total_stickers)
values ('00000000-0000-0000-0000-000000000001', 'FIFA World Cup 2026', 2026, 994)
on conflict (id) do nothing;

do $$
declare
  v_album_id  uuid    := '00000000-0000-0000-0000-000000000001';
  -- 48 selecciones reales en orden de grupos A–L (sorteo diciembre 2024)
  -- El índice determina la numeración: equipo[i] → base = 20 * i
  teams       text[]  := array[
    -- Grupo A
    'México',         'Sudáfrica',            'Corea del Sur',  'Chequia',
    -- Grupo B
    'Canadá',         'Bosnia y Herzegovina', 'Catar',          'Suiza',
    -- Grupo C
    'Brasil',         'Marruecos',            'Haití',          'Escocia',
    -- Grupo D
    'Estados Unidos', 'Paraguay',             'Australia',      'Türkiye',
    -- Grupo E
    'Alemania',       'Curazao',              'Costa de Marfil','Ecuador',
    -- Grupo F
    'Países Bajos',   'Japón',                'Suecia',         'Túnez',
    -- Grupo G
    'Bélgica',        'Egipto',               'Irán',           'Nueva Zelanda',
    -- Grupo H
    'España',         'Cabo Verde',           'Arabia Saudita', 'Uruguay',
    -- Grupo I
    'Francia',        'Senegal',              'Irak',           'Noruega',
    -- Grupo J
    'Argentina',      'Argelia',              'Austria',        'Jordania',
    -- Grupo K
    'Portugal',       'Rep. Dem. del Congo',  'Uzbekistán',     'Colombia',
    -- Grupo L
    'Inglaterra',     'Croacia',              'Ghana',          'Panamá'
  ];
  -- FWC "hoja 0": figuritas 00–19
  fwc_names   text[]  := array[
    'Panini Logo',                -- 00
    'Emblema Oficial 1/2',        -- 01
    'Emblema Oficial 2/2',        -- 02
    'Mascotas Oficiales',         -- 03
    'Eslogan Oficial',            -- 04
    'Balón Oficial',              -- 05
    'Canadá (Sede)',              -- 06
    'México (Sede)',              -- 07
    'Estados Unidos (Sede)',      -- 08
    'Foto Equipo Italia 1934',    -- 09
    'Foto Equipo Uruguay 1950',   -- 10
    'Foto Equipo Alemania 1954',  -- 11
    'Foto Equipo Brasil 1962',    -- 12
    'Foto Equipo Alemania 1974',  -- 13
    'Foto Equipo Argentina 1986', -- 14
    'Foto Equipo Brasil 1994',    -- 15
    'Foto Equipo Brasil 2002',    -- 16
    'Foto Equipo Italia 2006',    -- 17
    'Foto Equipo Alemania 2014',  -- 18
    'Foto Equipo Argentina 2022'  -- 19
  ];
  v_team text;
  v_i    integer;
  v_j    integer;
  v_base integer;
  v_rar  text;
begin
  -- 00–19: FWC especiales
  for v_i in 0..19 loop
    v_rar := case
      when v_i in (0, 1, 2) then 'foil'
      when v_i in (3, 5, 14, 19) then 'special'
      else 'common'
    end;
    insert into public.stickers (album_id, number, player_name, team, section, rarity)
    values (v_album_id, v_i, fwc_names[v_i + 1], null, 'FWC', v_rar)
    on conflict (album_id, number) do nothing;
  end loop;

  -- 20–979: 48 selecciones × 20 figuritas
  -- Estructura por equipo:
  --   base      → Escudo (foil)
  --   base+1    → Jugador 1 / Capitán (special)
  --   base+2..11 → Jugadores 2–11 (common)
  --   base+12   → Foto Grupal (special)
  --   base+13..19 → Jugadores 12–18 (common)
  for v_i in 1..array_length(teams, 1) loop
    v_team := teams[v_i];
    v_base := 20 * v_i;

    -- Escudo (foil)
    insert into public.stickers (album_id, number, player_name, team, section, rarity)
    values (v_album_id, v_base, 'Escudo ' || v_team, v_team, v_team, 'foil')
    on conflict (album_id, number) do nothing;

    -- Jugadores 1–11 (1 = capitán special, 2–11 = common)
    for v_j in 1..11 loop
      v_rar := case when v_j = 1 then 'special' else 'common' end;
      insert into public.stickers (album_id, number, player_name, team, section, rarity)
      values (v_album_id, v_base + v_j, 'Jugador ' || v_j, v_team, v_team, v_rar)
      on conflict (album_id, number) do nothing;
    end loop;

    -- Foto Grupal (special) — posición 13 dentro del equipo
    insert into public.stickers (album_id, number, player_name, team, section, rarity)
    values (v_album_id, v_base + 12, 'Foto Grupal', v_team, v_team, 'special')
    on conflict (album_id, number) do nothing;

    -- Jugadores 12–18 (common) — posiciones 14–20
    for v_j in 13..19 loop
      insert into public.stickers (album_id, number, player_name, team, section, rarity)
      values (v_album_id, v_base + v_j, 'Jugador ' || (v_j - 1), v_team, v_team, 'common')
      on conflict (album_id, number) do nothing;
    end loop;
  end loop;

  -- 1001–1014: Coca-Cola (offset 1000)
  for v_i in 1..14 loop
    v_rar := case when v_i <= 3 then 'foil' else 'special' end;
    insert into public.stickers (album_id, number, player_name, team, section, rarity)
    values (v_album_id, 1000 + v_i, 'Coca-Cola ' || v_i, null, 'Coca-Cola', v_rar)
    on conflict (album_id, number) do nothing;
  end loop;
end;
$$;

-- =============================================
-- TIEMPO REAL (REALTIME)
-- =============================================
alter publication supabase_realtime add table public.messages;

