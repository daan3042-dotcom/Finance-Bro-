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

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
