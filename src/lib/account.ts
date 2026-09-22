import { supabase } from './supabase';

/**
 * Verwijdert alle voortgangs- en profielgegevens van de ingelogde gebruiker
 * (concept_progress, lesson_progress, user_profiles). Werkt via de normale
 * Row Level Security-rechten van de gebruiker zelf — geen adminrechten nodig.
 *
 * Verwijdert NIET het inlogaccount zelf (auth.users): dat vereist een
 * geprivilegieerde server-side call (bijv. een Edge Function met de
 * service-role key) die hier bewust niet is gebouwd, omdat die key nooit
 * in client-code hoort. Dit is puur de "verwijder mijn data"-functie uit
 * §10 (AVG-lite); nog niet gekoppeld aan een UI-knop.
 */
export async function deleteMyData(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd: geen data om te verwijderen.');

  const [conceptResult, lessonResult, profileResult] = await Promise.all([
    supabase.from('concept_progress').delete().eq('user_id', user.id),
    supabase.from('lesson_progress').delete().eq('user_id', user.id),
    supabase.from('user_profiles').delete().eq('user_id', user.id),
  ]);

  const error = conceptResult.error ?? lessonResult.error ?? profileResult.error;
  if (error) throw error;
}
