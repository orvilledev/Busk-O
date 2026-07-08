-- Role-based access control.
--
--   superadmin  full access: add/edit/delete songs AND manage user roles
--   admin       add/edit/delete songs (the shared pool); cannot change roles
--   user        read-only songs; owns their setlists; keeps personal favorites
--
-- Songs stop being owner-scoped and become one shared library everyone can
-- read but only admins can modify. Favorites move to a per-user table so users
-- can still star songs without edit access to them.

-- ---------------------------------------------------------------------------
-- Roles + profiles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('user', 'admin', 'superadmin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill profiles for users who already exist.
insert into public.profiles (id, email)
  select id, email from auth.users
  on conflict (id) do nothing;

-- Seed the superadmin.
update public.profiles p
  set role = 'superadmin'
  from auth.users u
  where u.id = p.id and lower(u.email) = 'orvillebarba@gmail.com';

-- Auto-create a profile (role 'user') whenever a new account signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so RLS on profiles never recurses.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin(uid uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'superadmin'
  );
$$;

-- profiles RLS: read your own; the superadmin reads/updates everyone.
create policy "read own or all if superadmin"
  on public.profiles for select
  using (id = auth.uid() or public.is_superadmin(auth.uid()));

create policy "superadmin manages roles"
  on public.profiles for update
  using (public.is_superadmin(auth.uid()))
  with check (public.is_superadmin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Songs: shared pool. Everyone reads; only admins write.
-- ---------------------------------------------------------------------------
drop policy if exists "songs are owner-scoped" on public.songs;

create policy "songs readable by all authenticated"
  on public.songs for select
  to authenticated using (true);

create policy "admins insert songs"
  on public.songs for insert
  to authenticated with check (public.is_admin(auth.uid()));

create policy "admins update songs"
  on public.songs for update
  to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins delete songs"
  on public.songs for delete
  to authenticated using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Per-user favorites (users can't edit songs, so stars live in their own table)
-- ---------------------------------------------------------------------------
create table if not exists public.song_favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  song_id    uuid not null references public.songs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

alter table public.song_favorites enable row level security;

create policy "own favorites"
  on public.song_favorites for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Migrate existing per-song stars into per-user favorites, then retire the
-- column so a shared song can't carry one user's star for everyone.
insert into public.song_favorites (user_id, song_id)
  select user_id, id from public.songs where favorite
  on conflict do nothing;

drop index if exists public.songs_favorite_idx;
alter table public.songs drop column if exists favorite;

-- setlist_songs already keys off setlist ownership, so with songs now globally
-- readable, users can add any song from the pool to their own setlists.
