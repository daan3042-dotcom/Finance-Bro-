-- Finance Bro: index voor het efficiënt tellen van eerdere pogingen per
-- (gebruiker, vraag) — nodig om de geseede antwoord-shuffle een
-- attemptNumber te geven (zie lib/shuffle.ts en getAttemptCounts()).
-- Voer dit één keer uit in de Supabase SQL Editor van je project (of via
-- `supabase db push` als je de CLI linkt).

create index if not exists question_responses_user_question_idx
  on public.question_responses (user_id, question_id);
