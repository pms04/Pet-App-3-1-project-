-- WalkFix / Pet App Supabase schema
-- Supabase SQL Editor에서 실행하세요. 기존 테이블이 있으면 필요한 누락 테이블/정책만 보완합니다.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  profile_image_url text,
  bio text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  breed text,
  gender text,
  birth_date date,
  weight numeric,
  tendency text,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text,
  course_name text not null,
  distance text,
  duration text,
  content text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.walk_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete set null,
  distance_km numeric not null default 0,
  duration_sec integer not null default 0,
  gps_path jsonb not null default '[]'::jsonb,
  rating integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friends_no_self check (requester_id <> addressee_id),
  constraint friends_unique_pair unique (requester_id, addressee_id)
);

create table if not exists public.lightning_walks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  location text not null,
  starts_at timestamptz not null,
  max_participants integer not null default 4,
  ai_summary text,
  weather text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lightning_participants (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references public.lightning_walks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint lightning_participants_unique unique (walk_id, user_id)
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chat_room_members_unique unique (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_dogs_user_id on public.dogs(user_id);
create index if not exists idx_albums_user_id on public.albums(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_walk_logs_user_created on public.walk_logs(user_id, created_at desc);
create index if not exists idx_friends_requester on public.friends(requester_id, status);
create index if not exists idx_friends_addressee on public.friends(addressee_id, status);
create index if not exists idx_lightning_starts_at on public.lightning_walks(starts_at);
create index if not exists idx_lightning_participants_walk on public.lightning_participants(walk_id);
create index if not exists idx_chat_members_user on public.chat_room_members(user_id);
create index if not exists idx_messages_room_created on public.messages(room_id, created_at desc);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists set_dogs_updated_at on public.dogs;
create trigger set_dogs_updated_at before update on public.dogs for each row execute function public.set_updated_at();
drop trigger if exists set_albums_updated_at on public.albums;
create trigger set_albums_updated_at before update on public.albums for each row execute function public.set_updated_at();
drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
drop trigger if exists set_walk_logs_updated_at on public.walk_logs;
create trigger set_walk_logs_updated_at before update on public.walk_logs for each row execute function public.set_updated_at();
drop trigger if exists set_friends_updated_at on public.friends;
create trigger set_friends_updated_at before update on public.friends for each row execute function public.set_updated_at();
drop trigger if exists set_lightning_walks_updated_at on public.lightning_walks;
create trigger set_lightning_walks_updated_at before update on public.lightning_walks for each row execute function public.set_updated_at();
drop trigger if exists set_chat_rooms_updated_at on public.chat_rooms;
create trigger set_chat_rooms_updated_at before update on public.chat_rooms for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.dogs enable row level security;
alter table public.albums enable row level security;
alter table public.posts enable row level security;
alter table public.walk_logs enable row level security;
alter table public.friends enable row level security;
alter table public.lightning_walks enable row level security;
alter table public.lightning_participants enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.messages enable row level security;

-- 정책은 재실행 가능하도록 기존 정책을 정리한 뒤 다시 생성합니다.
drop policy if exists users_select_authenticated on public.users;
create policy users_select_authenticated on public.users for select to authenticated using (true);
drop policy if exists users_upsert_self on public.users;
create policy users_upsert_self on public.users for insert to authenticated with check (auth.uid() = id);
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists dogs_select_authenticated on public.dogs;
create policy dogs_select_authenticated on public.dogs for select to authenticated using (true);
drop policy if exists dogs_insert_self on public.dogs;
create policy dogs_insert_self on public.dogs for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists dogs_update_self on public.dogs;
create policy dogs_update_self on public.dogs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists dogs_delete_self on public.dogs;
create policy dogs_delete_self on public.dogs for delete to authenticated using (auth.uid() = user_id);

drop policy if exists albums_crud_self on public.albums;
create policy albums_crud_self on public.albums for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists posts_select_authenticated on public.posts;
create policy posts_select_authenticated on public.posts for select to authenticated using (true);
drop policy if exists posts_insert_self on public.posts;
create policy posts_insert_self on public.posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists posts_update_self on public.posts;
create policy posts_update_self on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists posts_delete_self on public.posts;
create policy posts_delete_self on public.posts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists walk_logs_crud_self on public.walk_logs;
create policy walk_logs_crud_self on public.walk_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists friends_select_related on public.friends;
create policy friends_select_related on public.friends for select to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friends_insert_requester on public.friends;
create policy friends_insert_requester on public.friends for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists friends_update_related on public.friends;
create policy friends_update_related on public.friends for update to authenticated using (auth.uid() = requester_id or auth.uid() = addressee_id) with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists lightning_select_authenticated on public.lightning_walks;
create policy lightning_select_authenticated on public.lightning_walks for select to authenticated using (true);
drop policy if exists lightning_insert_self on public.lightning_walks;
create policy lightning_insert_self on public.lightning_walks for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists lightning_update_self on public.lightning_walks;
create policy lightning_update_self on public.lightning_walks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists lightning_participants_select_authenticated on public.lightning_participants;
create policy lightning_participants_select_authenticated on public.lightning_participants for select to authenticated using (true);
drop policy if exists lightning_participants_insert_self on public.lightning_participants;
create policy lightning_participants_insert_self on public.lightning_participants for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists lightning_participants_delete_self on public.lightning_participants;
create policy lightning_participants_delete_self on public.lightning_participants for delete to authenticated using (auth.uid() = user_id);

drop policy if exists chat_rooms_select_member on public.chat_rooms;
create policy chat_rooms_select_member on public.chat_rooms for select to authenticated using (
  exists (select 1 from public.chat_room_members m where m.room_id = id and m.user_id = auth.uid())
);
drop policy if exists chat_rooms_insert_authenticated on public.chat_rooms;
create policy chat_rooms_insert_authenticated on public.chat_rooms for insert to authenticated with check (true);

drop policy if exists chat_members_select_member on public.chat_room_members;
create policy chat_members_select_member on public.chat_room_members for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.chat_room_members m where m.room_id = room_id and m.user_id = auth.uid())
);
drop policy if exists chat_members_insert_authenticated on public.chat_room_members;
create policy chat_members_insert_authenticated on public.chat_room_members for insert to authenticated with check (true);

drop policy if exists messages_select_room_member on public.messages;
create policy messages_select_room_member on public.messages for select to authenticated using (
  exists (select 1 from public.chat_room_members m where m.room_id = room_id and m.user_id = auth.uid())
);
drop policy if exists messages_insert_room_member on public.messages;
create policy messages_insert_room_member on public.messages for insert to authenticated with check (
  auth.uid() = sender_id and exists (select 1 from public.chat_room_members m where m.room_id = room_id and m.user_id = auth.uid())
);
