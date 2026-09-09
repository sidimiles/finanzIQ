import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme, cardShadow, radius, spacing } from '../../lib/theme';
import { Budget, Category } from '../../types/database';

type BudgetWithSpent = Budget & { category: Category | null; spent: number };

export default function Budgets() {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);

  const load = useCallback(async () => {
    const { data: budgetRows } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: true });

    if (!budgetRows) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startStr = startOfMonth.toISOString().slice(0, 10);

    const withSpent = await Promise.all(
      (budgetRows as any[]).map(async (b) => {
        const { data: txs } = await supabase
          .from('transactions')
          .select('amount')
          .eq('category_id', b.category_id)
          .gte('transaction_date', startStr)
          .lt('amount', 0);
        const spent = (txs ?? []).reduce((sum, t: any) => sum + Math.abs(Number(t.amount)), 0);
        return { ...b, spent };
      })
    );
    setBudgets(withSpent);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(budget: BudgetWithSpent) {
    Alert.alert('Budget löschen?', `Budget für "${budget.category?.name}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('budgets').delete().eq('id', budget.id);
          load();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.header, { color: colors.text }]}>Budgets</Text>
          <Text style={[styles.subheader, { color: colors.textMuted }]}>Dieser Monat</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, cardShadow, { backgroundColor: colors.accent, shadowColor: colors.accent }]} onPress={() => router.push('/(modals)/add-budget')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted }]}>Noch keine Budgets.{'\n'}Tippe oben auf +.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const pct = Math.min(100, (item.spent / Number(item.amount_limit)) * 100);
          const over = item.spent > Number(item.amount_limit);
          return (
            <TouchableOpacity
              style={[styles.card, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              onLongPress={() => confirmDelete(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.dot, { backgroundColor: item.category?.color || colors.accent }]} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.category?.name ?? 'Kategorie'}</Text>
                  {over && <Ionicons name="warning" size={14} color={colors.expense} />}
                </View>
                <Text style={[styles.cardAmount, { color: colors.textMuted }, over && { color: colors.expense, fontWeight: '700' }]}>
                  {item.spent.toFixed(0)} / {Number(item.amount_limit).toFixed(0)}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.cardAlt }]}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: over ? colors.expense : colors.accent }]} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  header: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  subheader: { fontSize: 14, marginTop: 4 },
  iconButton: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40, gap: 10 },
  empty: { textAlign: 'center', lineHeight: 20 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardAmount: { fontSize: 14, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
});
