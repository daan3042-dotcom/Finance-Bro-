-- Finance Bro: plaatsingsmarker voor de diagnosetoets (screening/plaatsing bij
-- de start van een track). Voer dit één keer uit in de Supabase SQL Editor
-- van je project (of via `supabase db push` als je de CLI linkt).

-- ============================================================
-- lesson_progress: onderscheid "echt doorlopen" vs "overgeslagen via de
-- diagnosetoets", zodat lesson_progress zelf de enige bron van waarheid
-- blijft voor welke lessen een gebruiker mag spelen (geen aparte tabel).
-- ============================================================
alter table public.lesson_progress
  add column if not exists placed_via_diagnostic boolean not null default false;

comment on column public.lesson_progress.placed_via_diagnostic is
  'true als deze les als voltooid is gemarkeerd door de diagnosetoets-plaatsing '
  '(de gebruiker heeft de les zelf niet gespeeld), false als de gebruiker de les '
  'daadwerkelijk heeft doorlopen.';
