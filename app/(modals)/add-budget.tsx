import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChipSelector } from '../../components/ChipSelector';
import { Category } from '../../types/database';

const PERIOD_OPTIONS = [
  { id: 'weekly', name: 'Wöchentlich' },
  { id: 'monthly', name: 'Monatlich' },
  { id: 'yearly', name: 'Jährlich' },
];

export default function AddBudget() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [period, setPeriod] = useState('monthly');
  const [amountLimit, setAmountLimit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('*').eq('type', 'expense');
      if (data) {
        setCategories(data as Category[]);
        if (data.length > 0) setCategoryId(data[0].id);
      }
    })();
  }, []);

  async function handleSave() {
    if (!categoryId) {
      Alert.alert('Fehlt', 'Bitte eine Kategorie auswählen.');
      return;
    }
    const parsed = parseFloat(amountLimit.replace(',', '.'));
    if (!amountLimit || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Fehlt', 'Bitte ein gültiges Limit eingeben.');
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const startOfPeriod = new Date();
    startOfPeriod.setDate(1);

    const { error } = await supabase.from('budgets').insert({
      user_id: user?.id,
      category_id: categoryId,
      amount_limit: parsed,
      period,
      start_date: startOfPeriod.toISOString().slice(0, 10),
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
      <Text style={styles.label}>Kategorie</Text>
      <ChipSelector
        items={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={styles.label}>Zeitraum</Text>
      <ChipSelector items={PERIOD_OPTIONS} selectedId={period} onSelect={setPeriod} />

      <Text style={styles.label}>Limit (CHF)</Text>
      <TextInput
        style={styles.input}
        placeholder="500.00"
        placeholderTextColor="#5A6472"
        keyboardType="decimal-pad"
        value={amountLimit}
        onChangeText={setAmountLimit}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Budget speichern'}</Text>
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
