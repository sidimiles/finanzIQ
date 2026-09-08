import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Budget, Category } from '../../types/database';

type BudgetWithSpent = Budget & { category: Category | null; spent: number };

export default function Budgets() {
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

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Budgets</Text>
      <Text style={styles.subheader}>Dieser Monat</Text>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Noch keine Budgets festgelegt.</Text>}
        renderItem={({ item }) => {
          const pct = Math.min(100, (item.spent / Number(item.amount_limit)) * 100);
          const over = item.spent > Number(item.amount_limit);
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{item.category?.name ?? 'Kategorie'}</Text>
                <Text style={[styles.cardAmount, over && styles.over]}>
                  {item.spent.toFixed(0)} / {Number(item.amount_limit).toFixed(0)} CHF
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${pct}%` }, over && styles.progressOver]}
                />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', padding: 20, paddingTop: 60 },
  header: { fontSize: 24, color: '#fff', fontWeight: '700' },
  subheader: { fontSize: 14, color: '#8A93A3', marginTop: 4 },
  empty: { color: '#8A93A3', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#151B23', borderRadius: 14, padding: 16, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardAmount: { color: '#8A93A3', fontSize: 14 },
  over: { color: '#FF6B6B' },
  progressTrack: { height: 8, backgroundColor: '#232B36', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#4F8CFF', borderRadius: 4 },
  progressOver: { backgroundColor: '#FF6B6B' },
});
