import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { ChipSelector } from '../../components/ChipSelector';
import { Account, Category } from '../../types/database';

const FREQ_OPTIONS = [
  { id: 'weekly', name: 'Wöchentlich' },
  { id: 'biweekly', name: 'Alle 2 Wochen' },
  { id: 'monthly', name: 'Monatlich' },
  { id: 'yearly', name: 'Jährlich' },
];

const TYPE_OPTIONS = [
  { id: 'expense', name: 'Ausgabe' },
  { id: 'income', name: 'Einnahme' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddRecurring() {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rpType, setRpType] = useState<'expense' | 'income'>('expense');
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
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').eq('type', rpType);
      if (cats) {
        setCategories(cats as Category[]);
        setCategoryId(cats.length > 0 ? cats[0].id : null);
      }
    })();
  }, [rpType]);

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

    const signedAmount = rpType === 'expense' ? -Math.abs(parsed) : Math.abs(parsed);

    const { error } = await supabase.from('recurring_payments').insert({
      user_id: user?.id,
      account_id: accountId,
      category_id: categoryId,
      name: name.trim(),
      amount: signedAmount,
      type: rpType,
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
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 20 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Art</Text>
      <ChipSelector items={TYPE_OPTIONS} selectedId={rpType} onSelect={(id) => setRpType(id as 'expense' | 'income')} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder={rpType === 'expense' ? 'z.B. Netflix, Miete' : 'z.B. Lohn'}
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Betrag (CHF)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Frequenz</Text>
      <ChipSelector items={FREQ_OPTIONS} selectedId={frequency} onSelect={setFrequency} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Konto</Text>
      {accounts.length === 0 ? (
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Noch kein Konto vorhanden — leg zuerst eines an.</Text>
      ) : (
        <ChipSelector items={accounts} selectedId={accountId} onSelect={setAccountId} />
      )}

      <Text style={[styles.label, { color: colors.textMuted }]}>Kategorie</Text>
      <ChipSelector
        items={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Nächste Fälligkeit (JJJJ-MM-TT)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={nextDueDate}
        onChangeText={setNextDueDate}
        placeholder="2026-10-01"
        placeholderTextColor={colors.textMuted}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Speichern'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: { borderRadius: 12, padding: 16, borderWidth: 1 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
