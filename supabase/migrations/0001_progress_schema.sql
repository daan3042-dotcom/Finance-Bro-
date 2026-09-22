-- Finance Bro: voortgangsopslag in Supabase (vervangt AsyncStorage).
-- Voer dit één keer uit in de Supabase SQL Editor van je project
-- (of via `supabase db push` als je de CLI linkt met je eigen credentials).

-- ============================================================
-- 1. user_profiles
-- ============================================================
create table if not exists public.user_profiles (
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_tier text not null default 'free',
  consent_given boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from anon, authenticated;
grant select, insert, update, delete on table public.user_profiles to authenticated;

create policy "Users can view their own profile"
  on public.user_profiles for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update their own profile"
  on public.user_profiles for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own profile"
  on public.user_profiles for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- Maakt automatisch een profielrij aan zodra iemand zich registreert.
-- Leest 'consent_given' uit de signup-metadata (options.data bij
-- supabase.auth.signUp), zodat consent al vastligt vóór de eerste
-- ingelogde sessie (relevant omdat e-mailbevestiging vereist is: er is
-- na signUp nog geen sessie om een aparte, geauthenticeerde update te doen).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, consent_given)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'consent_given')::boolean, false)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. lesson_progress (module-lessen: beginner/gevorderd/expert-tracks)
-- ============================================================
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null,
  track text not null,
  lesson_id text not null,
  completed boolean not null default false,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  seen_question_indices integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id, track, lesson_id)
);

alter table public.lesson_progress enable row level security;

revoke all on table public.lesson_progress from anon, authenticated;
grant select, insert, update, delete on table public.lesson_progress to authenticated;

create policy "Users can view their own lesson progress"
  on public.lesson_progress for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert their own lesson progress"
  on public.lesson_progress for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update their own lesson progress"
  on public.lesson_progress for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own lesson progress"
  on public.lesson_progress for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ============================================================
-- 3. concept_progress (losse concept-graaf-oefening)
-- ============================================================
create table if not exists public.concept_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_id text not null,
  completed boolean not null default false,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  consecutive_correct integer not null default 0,
  seen_question_indices integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

alter table public.concept_progress enable row level security;

revoke all on table public.concept_progress from anon, authenticated;
grant select, insert, update, delete on table public.concept_progress to authenticated;

create policy "Users can view their own concept progress"
  on public.concept_progress for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert their own concept progress"
  on public.concept_progress for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update their own concept progress"
  on public.concept_progress for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own concept progress"
  on public.concept_progress for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
