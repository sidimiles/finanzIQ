import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { ChipSelector } from '../../components/ChipSelector';
import { Account } from '../../types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTransfer() {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('accounts').select('*').eq('is_archived', false);
      if (data) {
        setAccounts(data as Account[]);
        if (data.length > 0) setFromId(data[0].id);
        if (data.length > 1) setToId(data[1].id);
      }
    })();
  }, []);

  async function handleSave() {
    if (!fromId || !toId) {
      Alert.alert('Fehlt', 'Bitte zwei Konten auswählen.');
      return;
    }
    if (fromId === toId) {
      Alert.alert('Ungültig', 'Von- und Nach-Konto müssen unterschiedlich sein.');
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

    const fromAccount = accounts.find((a) => a.id === fromId)!;
    const toAccount = accounts.find((a) => a.id === toId)!;
    const date = todayStr();

    const { error: err1 } = await supabase.from('transactions').insert({
      user_id: user?.id,
      account_id: fromId,
      category_id: null,
      amount: -parsed,
      description: `Transfer zu ${toAccount.name}`,
      transaction_date: date,
    });
    const { error: err2 } = await supabase.from('transactions').insert({
      user_id: user?.id,
      account_id: toId,
      category_id: null,
      amount: parsed,
      description: `Transfer von ${fromAccount.name}`,
      transaction_date: date,
    });

    if (!err1 && !err2) {
      await supabase.from('accounts').update({ balance: Number(fromAccount.balance) - parsed }).eq('id', fromId);
      await supabase.from('accounts').update({ balance: Number(toAccount.balance) + parsed }).eq('id', toId);
    }

    setSaving(false);
    if (err1 || err2) {
      Alert.alert('Fehler', (err1 || err2)?.message ?? 'Unbekannter Fehler');
      return;
    }
    router.back();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 20 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Von Konto</Text>
      <ChipSelector items={accounts} selectedId={fromId} onSelect={setFromId} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Nach Konto</Text>
      <ChipSelector items={accounts} selectedId={toId} onSelect={setToId} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Betrag (CHF)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Übertrag durchführen'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: { borderRadius: 12, padding: 16, borderWidth: 1 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
