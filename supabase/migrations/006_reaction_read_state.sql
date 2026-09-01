alter table public.reactions
  add column if not exists read_at timestamptz;

update public.reactions
set read_at = created_at
where read_at is null;

create index if not exists reactions_unread_idx
  on public.reactions (moment_id, created_at desc)
  where read_at is null;

create or replace function public.mark_own_reactions_read(target_reaction_ids uuid[] default null)
returns void
language sql
security definer
set search_path = public
as $$
  update public.reactions r
  set read_at = now()
  where r.read_at is null
    and r.user_id <> auth.uid()
    and (target_reaction_ids is null or r.id = any(target_reaction_ids))
    and exists (
      select 1
      from public.moments m
      where m.id = r.moment_id
        and m.user_id = auth.uid()
    );
$$;

revoke all on function public.mark_own_reactions_read(uuid[]) from public;
grant execute on function public.mark_own_reactions_read(uuid[]) to authenticated;
