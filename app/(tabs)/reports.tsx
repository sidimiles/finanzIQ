import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

type CategorySummary = { category_name: string; total: number };

export default function Reports() {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);

  const load = useCallback(async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startStr = startOfMonth.toISOString().slice(0, 10);

    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .gte('transaction_date', startStr);

    if (!txs) return;

    let inc = 0;
    let exp = 0;
    const catMap: Record<string, number> = {};

    (txs as any[]).forEach((t) => {
      const amt = Number(t.amount);
      if (amt >= 0) inc += amt;
      else {
        exp += Math.abs(amt);
        const name = t.category?.name ?? 'Sonstiges';
        catMap[name] = (catMap[name] ?? 0) + Math.abs(amt);
      }
    });

    setIncome(inc);
    setExpenses(exp);
    setByCategory(
      Object.entries(catMap)
        .map(([category_name, total]) => ({ category_name, total }))
        .sort((a, b) => b.total - a.total)
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Berichte</Text>
      <Text style={styles.subheader}>Dieser Monat</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { marginRight: 8 }]}>
          <Text style={styles.summaryLabel}>Einnahmen</Text>
          <Text style={[styles.summaryValue, styles.income]}>+{income.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ausgaben</Text>
          <Text style={[styles.summaryValue, styles.expense]}>-{expenses.toFixed(0)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Nach Kategorie</Text>
      <FlatList
        data={byCategory}
        keyExtractor={(item) => item.category_name}
        ListEmptyComponent={<Text style={styles.empty}>Keine Ausgaben diesen Monat.</Text>}
        renderItem={({ item }) => (
          <View style={styles.catRow}>
            <Text style={styles.catName}>{item.category_name}</Text>
            <Text style={styles.catAmount}>{item.total.toFixed(0)} CHF</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', padding: 20, paddingTop: 60 },
  header: { fontSize: 24, color: '#fff', fontWeight: '700' },
  subheader: { fontSize: 14, color: '#8A93A3', marginTop: 4, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#151B23', borderRadius: 14, padding: 16 },
  summaryLabel: { color: '#8A93A3', fontSize: 13 },
  summaryValue: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  income: { color: '#4ADE80' },
  expense: { color: '#FF6B6B' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  empty: { color: '#8A93A3', textAlign: 'center', marginTop: 20 },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232B36',
  },
  catName: { color: '#fff', fontSize: 15 },
  catAmount: { color: '#8A93A3', fontSize: 15 },
});
