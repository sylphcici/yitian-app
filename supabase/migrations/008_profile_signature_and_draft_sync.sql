alter table public.profiles
  add column if not exists signature text not null default '记录今天，也收藏自己';
