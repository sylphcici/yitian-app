create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('hide_moment', 'hide_user', 'topic', 'mood', 'repeat')),
  target_key text not null,
  target_user_id uuid references public.profiles(id) on delete cascade,
  topic text,
  mood text,
  source_moment_id uuid references public.moments(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feedback_type, target_key)
);

create index if not exists recommendation_feedback_user_idx
  on public.recommendation_feedback (user_id, created_at desc);

alter table public.recommendation_feedback enable row level security;

drop policy if exists "users read own recommendation feedback" on public.recommendation_feedback;
create policy "users read own recommendation feedback"
  on public.recommendation_feedback for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users create own recommendation feedback" on public.recommendation_feedback;
create policy "users create own recommendation feedback"
  on public.recommendation_feedback for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own recommendation feedback" on public.recommendation_feedback;
create policy "users update own recommendation feedback"
  on public.recommendation_feedback for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own recommendation feedback" on public.recommendation_feedback;
create policy "users delete own recommendation feedback"
  on public.recommendation_feedback for delete to authenticated
  using (auth.uid() = user_id);
