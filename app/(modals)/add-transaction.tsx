import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { ChipSelector } from '../../components/ChipSelector';
import { suggestCategory } from '../../lib/categorize';
import { Account, Category } from '../../types/database';

const TYPE_OPTIONS = [
  { id: 'expense', name: 'Ausgabe' },
  { id: 'income', name: 'Einnahme' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTransaction() {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr());
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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

  async function pickReceipt() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Keine Berechtigung', 'Zugriff auf Fotos wurde verweigert.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  async function uploadReceipt(userId: string): Promise<string | null> {
    if (!receiptUri) return null;
    setUploadingReceipt(true);
    try {
      const response = await fetch(receiptUri);
      const blob = await response.arrayBuffer();
      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('receipts').upload(fileName, blob, {
        contentType: 'image/jpeg',
      });
      if (error) {
        Alert.alert('Beleg-Upload fehlgeschlagen', error.message);
        return null;
      }
      return fileName;
    } finally {
      setUploadingReceipt(false);
    }
  }

  function handleDescriptionChange(text: string) {
    setDescription(text);
    const suggestedName = suggestCategory(text);
    if (suggestedName) {
      const match = categories.find((c) => c.name === suggestedName);
      if (match) setCategoryId(match.id);
    }
  }

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

    const receiptPath = user ? await uploadReceipt(user.id) : null;
    const signedAmount = txType === 'expense' ? -Math.abs(parsed) : Math.abs(parsed);

    const { error } = await supabase.from('transactions').insert({
      user_id: user?.id,
      account_id: accountId,
      category_id: categoryId,
      amount: signedAmount,
      description: description.trim() || null,
      transaction_date: date,
      receipt_url: receiptPath,
    });

    if (!error) {
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
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 20 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Art</Text>
      <ChipSelector items={TYPE_OPTIONS} selectedId={txType} onSelect={(id) => setTxType(id as 'expense' | 'income')} />

      <Text style={[styles.label, { color: colors.textMuted }]}>Betrag (CHF)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Konto</Text>
      {accounts.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Noch kein Konto vorhanden — leg zuerst eines an.</Text>
      ) : (
        <ChipSelector items={accounts} selectedId={accountId} onSelect={setAccountId} />
      )}

      <Text style={[styles.label, { color: colors.textMuted }]}>Kategorie</Text>
      <ChipSelector
        items={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Beschreibung (optional)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="z.B. Migros Einkauf"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={handleDescriptionChange}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Datum (JJJJ-MM-TT)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={date}
        onChangeText={setDate}
        placeholder="2026-09-08"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Beleg (optional)</Text>
      {receiptUri ? (
        <TouchableOpacity onPress={pickReceipt}>
          <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.receiptButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={pickReceipt}
        >
          <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted }}>Foto auswählen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSave} disabled={saving || uploadingReceipt}>
        <Text style={styles.buttonText}>{saving || uploadingReceipt ? 'Speichern...' : 'Buchung speichern'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: { borderRadius: 12, padding: 16, borderWidth: 1 },
  empty: { fontSize: 14 },
  receiptButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 16, borderWidth: 1, borderStyle: 'dashed' },
  receiptPreview: { width: '100%', height: 160, borderRadius: 12 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
