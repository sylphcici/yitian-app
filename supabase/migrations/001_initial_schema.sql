create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '新用户',
  avatar_text text not null default '新',
  city text,
  created_at timestamptz not null default now()
);

create table public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 120),
  mood varchar(4) not null default '未标记',
  tags text[] not null default '{}',
  visibility text not null default 'same_frequency' check (visibility in ('same_frequency', 'private')),
  location_name text,
  match_city text,
  image_url text,
  has_photo boolean not null default false,
  edited_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (moment_id, user_id)
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.drafts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index moments_public_feed_idx on public.moments (expires_at desc)
  where visibility = 'same_frequency' and archived_at is null;
create index moments_owner_idx on public.moments (user_id, created_at desc);
create index reactions_moment_idx on public.reactions (moment_id);
create index replies_receiver_idx on public.replies (receiver_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.moments enable row level security;
alter table public.reactions enable row level security;
alter table public.replies enable row level security;
alter table public.drafts enable row level security;

create policy "profiles are readable" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "active public moments or own moments are readable" on public.moments
  for select to authenticated using (
    auth.uid() = user_id or
    (visibility = 'same_frequency' and archived_at is null and expires_at > now())
  );
create policy "users create own moments" on public.moments for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own moments" on public.moments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own moments" on public.moments for delete to authenticated using (auth.uid() = user_id);

create policy "reactions on visible moments are readable" on public.reactions for select to authenticated using (
  exists (select 1 from public.moments m where m.id = moment_id)
);
create policy "users create own reactions" on public.reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own reactions" on public.reactions for delete to authenticated using (auth.uid() = user_id);

create policy "participants read replies" on public.replies for select to authenticated using (auth.uid() in (sender_id, receiver_id));
create policy "users send replies" on public.replies for insert to authenticated with check (auth.uid() = sender_id);
create policy "senders delete replies" on public.replies for delete to authenticated using (auth.uid() = sender_id);

create policy "users manage own draft" on public.drafts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_text, city)
  values (new.id, '林间', '林', '广州');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
