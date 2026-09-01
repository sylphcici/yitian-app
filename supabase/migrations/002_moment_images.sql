insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'moment-images',
  'moment-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload own moment images" on storage.objects;
drop policy if exists "visible moment images are readable" on storage.objects;
drop policy if exists "users update own moment images" on storage.objects;
drop policy if exists "users delete own moment images" on storage.objects;

create policy "users upload own moment images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'moment-images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "visible moment images are readable"
on storage.objects for select to authenticated
using (
  bucket_id = 'moment-images' and (
    owner_id = auth.uid()::text or
    exists (
      select 1
      from public.moments m
      where m.image_url = name
        and m.visibility = 'same_frequency'
        and m.archived_at is null
        and m.expires_at > now()
    )
  )
);

create policy "users update own moment images"
on storage.objects for update to authenticated
using (bucket_id = 'moment-images' and owner_id = auth.uid()::text)
with check (bucket_id = 'moment-images' and owner_id = auth.uid()::text);

create policy "users delete own moment images"
on storage.objects for delete to authenticated
using (bucket_id = 'moment-images' and owner_id = auth.uid()::text);
