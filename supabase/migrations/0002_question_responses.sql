-- Finance Bro: ruwe antwoordlogging per beantwoorde vraag.
-- Fundament voor latere IRT/Bayesian Knowledge Tracing-analyse (nog niet
-- gebouwd, zie §16 van docs/project-instructions.md) — dit legt alleen de
-- schone ruwe data vast. Voer dit één keer uit in de Supabase SQL Editor
-- van je project (of via `supabase db push` als je de CLI linkt).

-- ============================================================
-- question_responses (append-only logboek, één rij per antwoord)
-- ============================================================
create table if not exists public.question_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  lesson_id text,
  track text,
  concept_ids text[] not null default '{}',
  is_correct boolean not null,
  selected_answer text not null,
  response_time_ms integer,
  session_id uuid not null,
  answered_at timestamptz not null default now()
);

alter table public.question_responses enable row level security;

-- Append-only: geen update/delete-rechten of -policy, alleen invoegen en
-- lezen van je eigen rijen. Zo kan een gebruiker een gelogd antwoord nooit
-- achteraf aanpassen of wissen.
revoke all on table public.question_responses from anon, authenticated;
grant select, insert on table public.question_responses to authenticated;

create policy "Users can view their own question responses"
  on public.question_responses for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert their own question responses"
  on public.question_responses for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- Nodig voor geordende reeksen per gebruiker (Bayesian Knowledge Tracing).
create index if not exists question_responses_user_answered_at_idx
  on public.question_responses (user_id, answered_at);

-- Nodig voor statistiek per vraag (Item Response Theory).
create index if not exists question_responses_question_id_idx
  on public.question_responses (question_id);
