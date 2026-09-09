import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

type CategorySummary = { category_name: string; total: number; color: string | null };

function monthRange(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  const start = new Date(d);
  const end = new Date(d);
  end.setMonth(end.getMonth() + 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function yearRange(offset: number) {
  const year = new Date().getFullYear() - offset;
  return { start: `${year}-01-01`, end: `${year + 1}-01-01` };
}

export default function Reports() {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [prevExpenses, setPrevExpenses] = useState(0);
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);

  const load = useCallback(async () => {
    const current = viewMode === 'month' ? monthRange(0) : yearRange(0);
    const previous = viewMode === 'month' ? monthRange(1) : yearRange(1);

    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, transaction_date, category:categories(name, color)')
      .gte('transaction_date', current.start)
      .lt('transaction_date', current.end);

    const { data: prevTxs } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', previous.start)
      .lt('transaction_date', previous.end)
      .lt('amount', 0);

    setPrevExpenses((prevTxs ?? []).reduce((sum, t: any) => sum + Math.abs(Number(t.amount)), 0));

    if (!txs) return;

    let inc = 0;
    let exp = 0;
    const catMap: Record<string, { total: number; color: string | null }> = {};

    (txs as any[]).forEach((t) => {
      const amt = Number(t.amount);
      if (amt >= 0) inc += amt;
      else {
        exp += Math.abs(amt);
        const name = t.category?.name ?? 'Sonstiges';
        if (!catMap[name]) catMap[name] = { total: 0, color: t.category?.color ?? colors.accent };
        catMap[name].total += Math.abs(amt);
      }
    });

    setIncome(inc);
    setExpenses(exp);
    setByCategory(
      Object.entries(catMap)
        .map(([category_name, v]) => ({ category_name, total: v.total, color: v.color }))
        .sort((a, b) => b.total - a.total)
    );
  }, [colors.accent, viewMode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const maxCat = byCategory.length > 0 ? byCategory[0].total : 1;
  const diff = expenses - prevExpenses;
  const diffPct = prevExpenses > 0 ? (diff / prevExpenses) * 100 : 0;
  const compareLabel = viewMode === 'month' ? 'Vs. letzter Monat' : 'Vs. letztes Jahr';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.text }]}>Berichte</Text>
        <View style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleOption, viewMode === 'month' && { backgroundColor: colors.accent }]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'month' ? '#fff' : colors.textMuted }]}>Monat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, viewMode === 'year' && { backgroundColor: colors.accent }]}
            onPress={() => setViewMode('year')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'year' ? '#fff' : colors.textMuted }]}>Jahr</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.subheader, { color: colors.textMuted }]}>
        {viewMode === 'month' ? 'Dieser Monat' : 'Dieses Jahr'}
      </Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, marginRight: 8 }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Einnahmen</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>+{income.toFixed(0)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Ausgaben</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>-{expenses.toFixed(0)}</Text>
        </View>
      </View>

      {prevExpenses > 0 && (
        <View style={[styles.compareCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.compareText, { color: colors.textMuted }]}>
            {compareLabel}:{' '}
            <Text style={{ color: diff >= 0 ? colors.expense : colors.income, fontWeight: '700' }}>
              {diff >= 0 ? '+' : ''}
              {diff.toFixed(0)} CHF ({diffPct >= 0 ? '+' : ''}
              {diffPct.toFixed(0)}%)
            </Text>
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Nach Kategorie</Text>
      <FlatList
        data={byCategory}
        keyExtractor={(item) => item.category_name}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Keine Ausgaben in diesem Zeitraum.</Text>}
        renderItem={({ item }) => (
          <View style={styles.catRow}>
            <View style={styles.catHeaderRow}>
              <Text style={[styles.catName, { color: colors.text }]}>{item.category_name}</Text>
              <Text style={[styles.catAmount, { color: colors.textMuted }]}>{item.total.toFixed(0)} CHF</Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${(item.total / maxCat) * 100}%`, backgroundColor: item.color || colors.accent },
                ]}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: '700' },
  toggle: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 2 },
  toggleOption: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  subheader: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 16 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  compareCard: { borderRadius: 12, padding: 12, marginBottom: 20 },
  compareText: { fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  empty: { textAlign: 'center', marginTop: 20 },
  catRow: { paddingVertical: 10 },
  catHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 15 },
  catAmount: { fontSize: 15 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});
