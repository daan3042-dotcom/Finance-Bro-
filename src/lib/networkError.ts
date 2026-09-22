// Eén centrale plek om technische fouten (netwerk, time-out) om te zetten
// naar een nette Nederlandse melding. Andere fouten (bijv. een verkeerd
// wachtwoord) geven we door zoals Supabase ze teruggeeft, want dat zijn
// geen verbindingsproblemen.

export const CONNECTIVITY_MESSAGE =
  'Geen verbinding. Controleer je internet en probeer het opnieuw.';

const GENERIC_MESSAGE = 'Er ging iets mis. Probeer het opnieuw.';

function isConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true; // onze eigen time-out (zie supabase.ts)

  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('network error')
  );
}

export function toUserMessage(error: unknown): string {
  if (isConnectivityError(error)) return CONNECTIVITY_MESSAGE;
  if (error instanceof Error && error.message) return error.message;
  return GENERIC_MESSAGE;
}
