import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from './supabase';

/**
 * Verwijdert het account van de ingelogde gebruiker volledig (D1), via de
 * server-side delete-account Edge Function — het verwijderen van het
 * inlogaccount vereist de service-role-sleutel, die nooit in de app-code
 * mag staan. De ON DELETE CASCADE-koppelingen op user_profiles,
 * lesson_progress, concept_progress en question_responses ruimen de rest
 * van de gebruikersdata automatisch op zodra het inlogaccount weg is.
 *
 * Geeft bij een fout een gewone Error terug met het beste beschikbare
 * bericht; de aanroeper zet dat zelf om naar een gebruikersvriendelijke
 * melding via `toUserMessage` (zie networkError.ts), zoals overal elders.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (!error) return;

  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }

  throw error;
}
