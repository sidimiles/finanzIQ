import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// FinanzIQ Supabase project
const supabaseUrl = 'https://ptccslxvbetniurwqopr.supabase.co';
const supabaseAnonKey = 'sb_publishable_fRLJq1CAxdC03Ro9S_ZGsA_gicL7Ic6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
