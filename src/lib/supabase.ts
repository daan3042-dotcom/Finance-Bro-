import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!rawSupabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Ontbrekende Supabase-omgevingsvariabelen: zet EXPO_PUBLIC_SUPABASE_URL en EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local'
  );
}

// createClient verwacht de kale project-URL (bijv. https://xxx.supabase.co) en
// voegt zelf /rest/v1, /auth/v1 etc. toe. Normaliseer hier naar de origin,
// zodat het ook werkt als EXPO_PUBLIC_SUPABASE_URL per ongeluk een pad
// zoals /rest/v1/ bevat.
const supabaseUrl = new URL(rawSupabaseUrl).origin;

// Zonder verbinding kan een fetch-aanroep voor altijd blijven hangen — dat
// is precies de eindeloze "laden..."-spinner die we willen voorkomen (C6).
// Deze custom fetch wordt door supabase-js gebruikt voor ZOWEL inloggen/
// sessieherstel als alle tabelaanroepen, dus dit is de ene centrale plek
// waar elke Supabase-aanroep een harde tijdslimiet krijgt.
const REQUEST_TIMEOUT_MS = 12_000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});
