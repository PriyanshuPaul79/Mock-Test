-- Run this once in Supabase: Dashboard → SQL Editor → New query → Run
-- idempotent: safe to re-run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  badges text[] not null default '{}',
  streak integer not null default 0,
  streak_last_date date,
  streak_best integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  exam text not null,
  paper text not null default '',
  file_name text not null default '',
  total integer not null,
  correct integer not null,
  wrong integer not null,
  unattempted integer not null,
  attempted integer not null,
  accuracy integer not null,
  score numeric not null,
  max_marks numeric not null,
  time_used integer not null,
  time_limit integer not null,
  xp integer not null,
  subjects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_created on public.attempts (user_id, created_at desc);

-- RLS: users can only touch their own rows
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "own profile select" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "own attempts select" on public.attempts;
drop policy if exists "own attempts insert" on public.attempts;

create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

create policy "own attempts select" on public.attempts
  for select using (auth.uid() = user_id);
create policy "own attempts insert" on public.attempts
  for insert with check (auth.uid() = user_id);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();