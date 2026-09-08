import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Fehler', error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FinanzIQ</Text>
      <Text style={styles.subtitle}>{isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}</Text>

      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : isSignUp ? 'Registrieren' : 'Anmelden'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switchText}>
          {isSignUp ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0B0F14' },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#8A93A3', marginBottom: 32 },
  input: {
    backgroundColor: '#151B23',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#232B36',
  },
  button: { backgroundColor: '#4F8CFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  switchText: { color: '#8A93A3', textAlign: 'center', marginTop: 20 },
});
