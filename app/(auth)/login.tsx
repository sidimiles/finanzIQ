import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { signInWithApple, useGoogleAuth } from '../../lib/oauth';

export default function Login() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const { request: googleRequest, response: googleResponse, promptAsync: googlePrompt, handleResponse: handleGoogleResponse } = useGoogleAuth();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleResponse().catch((e) => Alert.alert('Fehler', e.message));
    }
  }, [googleResponse]);

  async function handleSubmit() {
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Fehler', error.message);
  }

  async function handleApple() {
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') Alert.alert('Fehler', e.message ?? 'Apple-Anmeldung fehlgeschlagen');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>FinanzIQ</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="E-Mail"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Passwort"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : isSignUp ? 'Registrieren' : 'Anmelden'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={[styles.switchText, { color: colors.textMuted }]}>
          {isSignUp ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={12}
          style={styles.appleButton}
          onPress={handleApple}
        />
      )}

      <TouchableOpacity
        style={[styles.oauthButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        disabled={!googleRequest}
        onPress={() => googlePrompt()}
      >
        <Ionicons name="logo-google" size={18} color={colors.text} />
        <Text style={[styles.oauthText, { color: colors.text }]}>Mit Google anmelden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  input: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  switchText: { textAlign: 'center', marginTop: 20 },
  divider: { height: 1, marginVertical: 28 },
  appleButton: { height: 50, marginBottom: 12 },
  oauthButton: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, borderWidth: 1 },
  oauthText: { fontWeight: '600', fontSize: 15 },
});
