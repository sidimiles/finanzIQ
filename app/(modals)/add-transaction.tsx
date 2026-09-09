import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChipSelector } from '../../components/ChipSelector';
import { Account, Category } from '../../types/database';

const TYPE_OPTIONS = [
  { id: 'expense', name: 'Ausgabe' },
  { id: 'income', name: 'Einnahme' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTransaction() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr());
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
      const { data: cats } = await supabase.from('categories').select('*').eq('type', txType);
      if (cats) {
        setCategories(cats as Category[]);
        setCategoryId(cats.length > 0 ? cats[0].id : null);
      }
    })();
  }, [txType]);

  async function handleSave() {
    if (!accountId) {
      Alert.alert('Fehlt', 'Bitte ein Konto auswählen (zuerst ein Konto anlegen).');
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

    const signedAmount = txType === 'expense' ? -Math.abs(parsed) : Math.abs(parsed);

    const { error } = await supabase.from('transactions').insert({
      user_id: user?.id,
      account_id: accountId,
      category_id: categoryId,
      amount: signedAmount,
      description: description.trim() || null,
      transaction_date: date,
    });

    if (!error) {
      // update account balance
      const account = accounts.find((a) => a.id === accountId);
      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) + signedAmount })
          .eq('id', accountId);
      }
    }

    setSaving(false);
    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Art</Text>
      <ChipSelector items={TYPE_OPTIONS} selectedId={txType} onSelect={(id) => setTxType(id as 'expense' | 'income')} />

      <Text style={styles.label}>Betrag (CHF)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#5A6472"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

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

      <Text style={styles.label}>Beschreibung (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="z.B. Migros Einkauf"
        placeholderTextColor="#5A6472"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Datum (JJJJ-MM-TT)</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-09-08" placeholderTextColor="#5A6472" />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Buchung speichern'}</Text>
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
