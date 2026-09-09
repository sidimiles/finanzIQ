import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { ThemeProvider, useTheme } from '../lib/theme';

const BIOMETRIC_KEY = 'finanziq_biometric_enabled';

function RootNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        supabase.rpc('process_due_recurring_payments').then(() => {});
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase.rpc('process_due_recurring_payments').then(() => {});
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(BIOMETRIC_KEY).then((val) => {
      const enabled = val === 'true';
      setBiometricEnabled(enabled);
      if (enabled) setLocked(true);
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && biometricEnabled) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [biometricEnabled]);

  async function unlock() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'FinanzIQ entsperren',
      fallbackLabel: 'PIN verwenden',
    });
    if (result.success) setLocked(false);
  }

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/accounts');
    }
  }, [session, segments, loading]);

  if (loading) return null;

  if (session && locked && biometricEnabled) {
    return (
      <View style={[styles.lockContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="lock-closed" size={48} color={colors.accent} />
        <Text style={[styles.lockTitle, { color: colors.text }]}>FinanzIQ gesperrt</Text>
        <TouchableOpacity style={[styles.unlockButton, { backgroundColor: colors.accent }]} onPress={unlock}>
          <Text style={styles.unlockButtonText}>Entsperren</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  lockContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  lockTitle: { fontSize: 20, fontWeight: '700' },
  unlockButton: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 8 },
  unlockButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNav />
    </ThemeProvider>
  );
}
