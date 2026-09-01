alter table public.moments
add column if not exists image_urls text[] not null default '{}';

update public.moments
set image_urls = array[image_url]
where image_url is not null
  and cardinality(image_urls) = 0;

drop policy if exists "visible moment images are readable" on storage.objects;

create policy "visible moment images are readable"
on storage.objects for select to authenticated
using (
  bucket_id = 'moment-images' and (
    owner_id = auth.uid()::text or
    exists (
      select 1
      from public.moments m
      where (
          m.image_url = name
          or name = any(m.image_urls)
        )
        and m.visibility = 'same_frequency'
        and m.archived_at is null
        and m.expires_at > now()
    )
  )
);
