import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChipSelector } from '../../components/ChipSelector';

const ACCOUNT_TYPES = [
  { id: 'checking', name: 'Girokonto' },
  { id: 'savings', name: 'Sparkonto' },
  { id: 'cash', name: 'Bargeld' },
  { id: 'credit_card', name: 'Kreditkarte' },
  { id: 'investment', name: 'Investment' },
];

export default function AddAccount() {
  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Fehlt', 'Bitte einen Namen eingeben.');
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('accounts').insert({
      user_id: user?.id,
      name: name.trim(),
      type,
      balance: balance ? parseFloat(balance.replace(',', '.')) : 0,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="z.B. UBS Privatkonto"
        placeholderTextColor="#5A6472"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Typ</Text>
      <ChipSelector items={ACCOUNT_TYPES} selectedId={type} onSelect={setType} />

      <Text style={styles.label}>Startsaldo (CHF)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#5A6472"
        keyboardType="decimal-pad"
        value={balance}
        onChangeText={setBalance}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Konto speichern'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  label: { color: '#8A93A3', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: '#151B23',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#232B36',
  },
  button: { backgroundColor: '#4F8CFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
