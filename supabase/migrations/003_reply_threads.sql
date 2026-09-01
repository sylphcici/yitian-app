alter table public.replies
  add column if not exists read_at timestamptz;

create index if not exists replies_moment_participants_idx
  on public.replies (moment_id, sender_id, receiver_id, created_at);

drop policy if exists "users send replies" on public.replies;
drop policy if exists "receivers mark replies read" on public.replies;

create or replace function public.can_reply_to_moment(target_moment_id uuid, target_receiver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.moments m
    where m.id = target_moment_id
      and m.expires_at > now()
      and m.archived_at is null
      and (
        m.user_id = target_receiver_id
        or (
          m.user_id = auth.uid()
          and exists (
            select 1
            from public.replies previous
            where previous.moment_id = target_moment_id
              and auth.uid() in (previous.sender_id, previous.receiver_id)
              and target_receiver_id in (previous.sender_id, previous.receiver_id)
          )
        )
      )
  );
$$;

revoke all on function public.can_reply_to_moment(uuid, uuid) from public;
grant execute on function public.can_reply_to_moment(uuid, uuid) to authenticated;

create policy "users send replies"
on public.replies for insert to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> receiver_id
  and public.can_reply_to_moment(moment_id, receiver_id)
);

create policy "receivers mark replies read"
on public.replies for update to authenticated
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);
