import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

const COLORS = ['#4F8CFF', '#4ADE80', '#F472B6', '#FFB86B', '#A78BFA'];

export default function AddGoal() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Fehlt', 'Bitte einen Namen eingeben.');
      return;
    }
    const parsed = parseFloat(targetAmount.replace(',', '.'));
    if (!targetAmount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Fehlt', 'Bitte ein gültiges Zielbetrag eingeben.');
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('goals').insert({
      user_id: user?.id,
      name: name.trim(),
      target_amount: parsed,
      target_date: targetDate.trim() || null,
      color,
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="z.B. Ferien, Notgroschen"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Zielbetrag (CHF)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="2000.00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={targetAmount}
        onChangeText={setTargetAmount}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Zieldatum (optional, JJJJ-MM-TT)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="2027-06-01"
        placeholderTextColor={colors.textMuted}
        value={targetDate}
        onChangeText={setTargetDate}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>Farbe</Text>
      <View style={styles.colorRow}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Speichern...' : 'Sparziel erstellen'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: { borderRadius: 12, padding: 16, borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
