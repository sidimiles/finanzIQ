import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { Goal } from '../../types/database';

export default function Goals() {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [addingFundsFor, setAddingFundsFor] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
    if (data) setGoals(data as Goal[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(goal: Goal) {
    Alert.alert('Sparziel löschen?', `"${goal.name}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('goals').delete().eq('id', goal.id);
          load();
        },
      },
    ]);
  }

  async function addFunds(goal: Goal) {
    const parsed = parseFloat(fundAmount.replace(',', '.'));
    if (!fundAmount || isNaN(parsed) || parsed <= 0) return;
    const newAmount = Number(goal.current_amount) + parsed;
    await supabase
      .from('goals')
      .update({ current_amount: newAmount, is_completed: newAmount >= Number(goal.target_amount) })
      .eq('id', goal.id);
    setAddingFundsFor(null);
    setFundAmount('');
    load();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.text }]}>Sparziele</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/(modals)/add-goal')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Noch keine Sparziele. Tippe oben auf +.</Text>}
        renderItem={({ item }) => {
          const pct = Math.min(100, (Number(item.current_amount) / Number(item.target_amount)) * 100);
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onLongPress={() => confirmDelete(item)}>
              <View style={styles.cardRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {item.is_completed ? '🎉 ' : ''}
                  {item.name}
                </Text>
                <Text style={[styles.cardAmount, { color: colors.textMuted }]}>
                  {Number(item.current_amount).toFixed(0)} / {Number(item.target_amount).toFixed(0)} CHF
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: item.color || colors.accent }]} />
              </View>

              {addingFundsFor === item.id ? (
                <View style={styles.fundRow}>
                  <TextInput
                    style={[styles.fundInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Betrag"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={fundAmount}
                    onChangeText={setFundAmount}
                    autoFocus
                  />
                  <TouchableOpacity style={[styles.fundButton, { backgroundColor: colors.accent }]} onPress={() => addFunds(item)}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addFundsLink} onPress={() => setAddingFundsFor(item.id)}>
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>+ Geld hinzufügen</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: '700' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 14, padding: 16, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardAmount: { fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  addFundsLink: { marginTop: 10 },
  fundRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  fundInput: { flex: 1, borderRadius: 10, padding: 10, borderWidth: 1 },
  fundButton: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
