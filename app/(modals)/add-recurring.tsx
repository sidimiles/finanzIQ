import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChipSelector } from '../../components/ChipSelector';
import { Account, Category } from '../../types/database';

const FREQ_OPTIONS = [
  { id: 'weekly', name: 'Wöchentlich' },
  { id: 'biweekly', name: 'Alle 2 Wochen' },
  { id: 'monthly', name: 'Monatlich' },
  { id: 'yearly', name: 'Jährlich' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddRecurring() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: accs } = await supabase.from('accounts').select('*').eq('is_archived', false);
      if (accs) {
        setAccounts(accs as Account[]);
        if (accs.length > 0) setAccountId(accs[0].id);
      }
      const { data: cats } = await supabase.from('categories').select('*').eq('type', 'expense');
      if (cats) {
        setCategories(cats as Category[]);
        if (cats.length > 0) setCategoryId(cats[0].id);
      }
    })();
  }, []);

  async function handleSave() {
    if (!accountId) {
      Alert.alert('Fehlt', 'Bitte ein Konto auswählen (zuerst ein Konto anlegen).');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Fehlt', 'Bitte einen Namen eingeben.');
      return;
    }
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Fehlt', 'Bitte einen gültigen Betrag eingeben.');
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('recurring_payments').insert({
      user_id: user?.id,
      account_id: accountId,
      category_id: categoryId,
      name: name.trim(),
      amount: -Math.abs(parsed),
      frequency,
      next_due_date: nextDueDate,
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
        placeholder="z.B. Netflix, Miete"
        placeholderTextColor="#5A6472"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Betrag (CHF)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#5A6472"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Frequenz</Text>
      <ChipSelector items={FREQ_OPTIONS} selectedId={frequency} onSelect={setFrequency} />

      <Text style={styles.label}>Konto</Text>
      {accounts.length === 0 ? (
        <Text style={styles.empty}>Noch kein Konto vorhanden — leg zuerst eines an.</Text>
      ) : (
        <ChipSelector items={accounts} selectedId={accountId} onSelect={setAccountId} />
      )}

      <Text style={styles.label}>Kategorie</Text>
      <ChipSelector
        items={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={styles.label}>Nächste Fälligkeit (JJJJ-MM-TT)</Text>
      <TextInput
        style={styles.input}
        value={nextDueDate}
        onChangeText={setNextDueDate}
        placeholder="2026-10-01"
        placeholderTextColor="#5A6472"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Speichern'}</Text>
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
  empty: { color: '#5A6472', fontSize: 14 },
  button: { backgroundColor: '#4F8CFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
